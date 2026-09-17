import { cookies } from "next/headers";

import { API_URL } from "./site";

/**
 * fetch côté serveur vers une route authentifiée de l'API : transmet le
 * cookie `session_token` du visiteur. `no-store` est indispensable, la
 * réponse étant propre à l'utilisateur. Pas d'exception sans session :
 * l'appelant traite le 401.
 */
export async function serverFetch(path: string, init?: RequestInit): Promise<Response> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token");

  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (sessionToken) {
    headers["Cookie"] = `session_token=${sessionToken.value}`;
  }

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

/** Variante qui renvoie le JSON typé et lève si la réponse n'est pas OK. */
export async function serverFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await serverFetch(path, init);
  if (!res.ok) {
    throw new Error(`Server fetch failed: ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}
