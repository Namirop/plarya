import { NextResponse, type NextRequest } from "next/server";

/**
 * Launch protection — verrou HTTP Basic Auth sur tout le site.
 *
 * Masque Plarya au public jusqu'au launch officiel. Desactive par
 * defaut : no-op total tant que LAUNCH_PROTECT_ENABLED !== "true".
 * Quand actif, chaque page renvoie 401 + WWW-Authenticate (popup
 * navigateur) tant qu'un header Basic valide n'est pas presente.
 *
 * Toggle sans redeploy de code : on change la var d'env sur Vercel +
 * redeploy. Au launch -> LAUNCH_PROTECT_ENABLED=false (ou suppression).
 *
 * Perimetre : seul ce frontend (le site visible) est couvert. L'API
 * backend (api.plarya.com) est un service distinct, avec sa propre
 * securite (CSRF, rate-limit, sessions) — non concerne par ce verrou.
 */
export default function proxy(req: NextRequest): NextResponse {
  const gate = enforceLaunchProtection(req);
  if (gate) return gate;
  return NextResponse.next();
}

/**
 * - Desactive (LAUNCH_PROTECT_ENABLED !== "true") -> null, site public.
 * - Actif -> 401 + WWW-Authenticate tant qu'un header Basic valide n'est
 *   pas presente.
 *
 * Les assets statiques (/_next, /favicon.ico, *.png, etc.) n'atteignent
 * jamais ce code : ils sont exclus en amont par `config.matcher`.
 */
function enforceLaunchProtection(req: NextRequest): NextResponse | null {
  if (process.env.LAUNCH_PROTECT_ENABLED !== "true") return null;

  const authorization = req.headers.get("authorization");
  if (authorization && isValidBasicAuth(authorization)) return null;

  return new NextResponse("Authentification requise", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Plarya", charset="UTF-8"',
    },
  });
}

/**
 * Valide un header `Authorization: Basic base64(user:pass)` contre les
 * creds d'env. Fail-closed : verrou actif mais USERNAME/PASSWORD non
 * configures -> on refuse tout (un site cense etre masque ne doit pas
 * s'ouvrir par simple oubli de config).
 */
function isValidBasicAuth(authorization: string): boolean {
  const expectedUser = process.env.LAUNCH_PROTECT_USERNAME;
  const expectedPass = process.env.LAUNCH_PROTECT_PASSWORD;
  if (!expectedUser || !expectedPass) {
    console.warn(
      "[proxy/launch-protect] LAUNCH_PROTECT_ENABLED=true mais " +
        "USERNAME/PASSWORD manquant — acces bloque (fail-closed).",
    );
    return false;
  }

  const [scheme, encoded] = authorization.split(" ");
  if (scheme !== "Basic" || !encoded) return false;

  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    return false;
  }

  // Le mot de passe peut contenir des ":" -> on coupe sur le premier.
  const separator = decoded.indexOf(":");
  if (separator === -1) return false;

  return (
    decoded.slice(0, separator) === expectedUser &&
    decoded.slice(separator + 1) === expectedPass
  );
}

export const config = {
  matcher: [
    // Tout sauf : assets statiques Next, favicon, et fichiers avec
    // extension (motif `.*\..*`). Le verrou ne s'applique qu'aux pages
    // "visitables".
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
