import { API_URL } from "./site";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "X-CSRF-Token";

/**
 * Réponse non-2xx : `message` affichable, `code` stable renvoyé par l'API
 * (ex. "pseudo_taken", voir backend/src/services/errors.ts) et `status` HTTP.
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

/** Cookie csrf_token s'il est lisible depuis ce domaine ; null côté serveur. */
function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Front et API sur des domaines différents (ex. `app.example.com` et
// `api.example.net`) : le cookie CSRF de l'API n'est pas lisible ici. Le token
// est alors lu dans la réponse de /auth/csrf et gardé en mémoire ; le cookie
// reste envoyé par le navigateur, la double soumission fonctionne donc.
let csrfTokenCache: string | null = null;

/** Token CSRF : cookie lisible, sinon cache, sinon appel à /auth/csrf. */
async function ensureCsrfToken(): Promise<string | null> {
  const cookieToken = getCsrfToken();
  if (cookieToken) return cookieToken;
  if (csrfTokenCache) return csrfTokenCache;
  try {
    const res = await fetch(`${API_URL}/auth/csrf`, { credentials: "include" });
    const fromCookie = getCsrfToken();
    if (fromCookie) return fromCookie;
    const body = (await res.json().catch(() => null)) as { token?: string | null } | null;
    csrfTokenCache = body?.token ?? null;
    return csrfTokenCache;
  } catch {
    /* API injoignable : la requête principale remontera l'erreur */
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

  // Sans token, la requête part quand même et l'API répond 403.
  if (isMutating) {
    const token = await ensureCsrfToken();
    if (token) headers[CSRF_HEADER] = token;
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
}

/** ApiError à partir du corps `{ error, code }`, ou message générique si le corps n'est pas du JSON. */
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

/** Téléchargement : Blob et nom de fichier du Content-Disposition (null si absent). */
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
