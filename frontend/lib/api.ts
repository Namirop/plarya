const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

/**
 * Garantit qu'on a un csrf_token disponible avant une requête mutante.
 * Si absent (1re visite avant tout GET), on fait un fetch préalable à
 * /auth/csrf pour forcer le serveur à poser le cookie.
 */
async function ensureCsrfToken(): Promise<string | null> {
  let token = getCsrfToken();
  if (token) return token;
  try {
    await fetch(`${API_URL}/auth/csrf`, { credentials: "include" });
    token = getCsrfToken();
  } catch {
    /* offline ou backend down — on laisse passer, le call principal
       gérera l'erreur réseau de son côté */
  }
  return token;
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
async function parseApiError(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => null);
  const message = body?.error ?? `Erreur ${res.status}`;
  const code = typeof body?.code === "string" ? body.code : null;
  return new ApiError(message, { code, status: res.status });
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) {
    throw await parseApiError(res);
  }
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw await parseApiError(res);
  }
  return res.json();
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw await parseApiError(res);
  }
  return res.json();
}
