import { cookies } from "next/headers";

import { API_URL } from "./site";

/**
 * Wrapper fetch côté server component pour les endpoints AUTHENTIFIÉS
 * du backend. Forward automatiquement le cookie `session_token` du
 * client vers le backend, et désactive le cache Next (les pages
 * connectées doivent rendre des données fraîches à chaque navigation).
 *
 * Usage typique dans un server component :
 *   const res = await serverFetch("/auth/me");
 *   if (!res.ok) redirect("/");
 *   const user = await res.json();
 *
 * Notes :
 *  - `cookies()` est async depuis Next 15 (compatibilité strict mode).
 *  - `cache: "no-store"` est essentiel : sans ça, deux users différents
 *    pourraient voir les data l'un de l'autre via le cache HTTP de Next.
 *  - On ne lance pas d'exception si la session est absente — le caller
 *    décide quoi faire (souvent : laisser le backend renvoyer 401 et
 *    rediriger).
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

/**
 * Variante typée qui parse la réponse JSON et lance si non-OK. Pour
 * les chemins server où on veut juste les données ou un crash explicite.
 */
export async function serverFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await serverFetch(path, init);
  if (!res.ok) {
    throw new Error(`Server fetch failed: ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}
