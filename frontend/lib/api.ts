import { API_URL } from "./site";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "X-CSRF-Token";

/**
 * Erreur thrown par les helpers apiGet/apiPost/apiPatch en cas de
 * réponse HTTP non-2xx.
 *
 * Expose en plus du `message` (texte FR user-facing) :
 *  - `code`   : identifiant stable machine-readable renvoyé par le
 *               backend (cf. backend/src/services/errors.ts — chaque
 *               sous-classe domaine override `code` avec une valeur
 *               snake_case discriminante : "pseudo_taken",
 *               "email_required", "already_subscribed", etc.).
 *  - `status` : HTTP status code (utile pour les fallbacks génériques
 *               quand `code` n'est pas exploité).
 *
 * Backward-compat : `err.message` reste disponible partout. Les
 * composants existants qui catch et affichent juste le message
 * continuent à fonctionner sans changement.
 *
 * Pour brancher sur le code :
 *   } catch (err) {
 *     if (err instanceof ApiError && err.code === "pseudo_taken") {
 *       setFieldError("pseudo", err.message);
 *       return;
 *     }
 *     setFormError(err instanceof Error ? err.message : "Erreur");
 *   }
 */
export class ApiError extends Error {
  readonly code: string | null;
  readonly status: number;

  constructor(message: string, options: { code?: string | null; status: number }) {
    super(message);
    this.name = "ApiError";
    this.code = options.code ?? null;
    this.status = options.status;
  }
}

/**
 * Lit le cookie csrf_token (posé par le backend, NON-httpOnly, donc
 * accessible via document.cookie). Renvoie null en SSR.
 */
function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Cache mémoire du token CSRF — indispensable en topologie CROSS-DOMAIN
// (front et back sur des domaines différents, ex `plarya.com` +
// `*.up.railway.app`). Dans ce cas, `document.cookie` côté front NE PEUT
// PAS lire le cookie `csrf_token` posé sur le domaine du backend (les
// cookies sont cloisonnés par domaine). On récupère donc le token depuis
// le BODY de /auth/csrf (le backend le renvoie) et on le garde ici. Le
// cookie, lui, reste envoyé automatiquement par le navigateur vers le
// backend (SameSite=None requis en cross-site), donc le double-submit
// (header X-CSRF-Token == cookie) tient toujours côté serveur.
// En same-origin / same-site (dev local, ou plus tard `api.plarya.com`),
// le cookie reste lisible → on privilégie ce chemin.
let csrfTokenCache: string | null = null;

/**
 * Garantit qu'on a un csrf_token disponible avant une requête mutante.
 * Ordre : cookie lisible (same-site) → cache mémoire → fetch /auth/csrf
 * (lit le cookie si same-site, sinon le token renvoyé dans le body).
 */
async function ensureCsrfToken(): Promise<string | null> {
  const cookieToken = getCsrfToken();
  if (cookieToken) return cookieToken;
  if (csrfTokenCache) return csrfTokenCache;
  try {
    const res = await fetch(`${API_URL}/auth/csrf`, { credentials: "include" });
    // Same-site : le cookie est désormais lisible, on le préfère.
    const fromCookie = getCsrfToken();
    if (fromCookie) return fromCookie;
    // Cross-domain : on lit le token dans le body et on le mémorise.
    const body = (await res.json().catch(() => null)) as { token?: string | null } | null;
    csrfTokenCache = body?.token ?? null;
    return csrfTokenCache;
  } catch {
    /* offline ou backend down — on laisse passer, le call principal
       gérera l'erreur réseau de son côté */
    return null;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method || "GET").toUpperCase();
  const isMutating = method !== "GET" && method !== "HEAD";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // CSRF token sur les méthodes mutantes (cf. backend/src/lib/csrf.ts).
  if (isMutating) {
    const token = await ensureCsrfToken();
    if (token) headers[CSRF_HEADER] = token;
    // Si pas de token (SSR ou backend injoignable), on laisse partir
    // la requête : elle échouera côté serveur avec 403, message clair
    // pour l'UI.
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
}

/**
 * Parse une réponse d'erreur backend en ApiError typée. Lit `error`
 * (message FR) et `code` (discriminant). Tombe sur un fallback générique
 * si le body n'est pas du JSON parsable (réseau down, 502 nginx, etc.).
 */
export async function parseApiError(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => null);
  const message = body?.error ?? `Erreur ${res.status}`;
  const code = typeof body?.code === "string" ? body.code : null;
  return new ApiError(message, { code, status: res.status });
}

export async function apiGet<T>(path: string, options?: { signal?: AbortSignal }): Promise<T> {
  const res = await apiFetch(path, { signal: options?.signal });
  if (!res.ok) {
    throw await parseApiError(res);
  }
  return res.json();
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options?: { signal?: AbortSignal },
): Promise<T> {
  const res = await apiFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
    signal: options?.signal,
  });
  if (!res.ok) {
    throw await parseApiError(res);
  }
  return res.json();
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  options?: { signal?: AbortSignal },
): Promise<T> {
  const res = await apiFetch(path, {
    method: "PATCH",
    body: JSON.stringify(body),
    signal: options?.signal,
  });
  if (!res.ok) {
    throw await parseApiError(res);
  }
  return res.json();
}

/**
 * Variante d'apiGet pour les téléchargements binaires (CSV, JSON export,
 * etc.). Renvoie le Blob brut + le filename extrait du Content-Disposition.
 *
 * Le filename est utile pour le `<a download={filename}>` côté caller :
 * le backend pose un Content-Disposition: attachment; filename="..." que
 * cette helper parse en best-effort. Si l'extraction échoue, le filename
 * est null et le caller doit en générer un.
 */
export async function apiBlob(path: string): Promise<{ blob: Blob; filename: string | null }> {
  const res = await apiFetch(path);
  if (!res.ok) {
    throw await parseApiError(res);
  }
  const cd = res.headers.get("Content-Disposition") || "";
  const match = cd.match(/filename="([^"]+)"/);
  const filename = match ? match[1] : null;
  const blob = await res.blob();
  return { blob, filename };
}
