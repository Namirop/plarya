import { NextResponse, type NextRequest } from "next/server";

/**
 * Verrou HTTP Basic optionnel sur toutes les pages du frontend, pour un
 * environnement non public. Inactif sauf si `LAUNCH_PROTECT_ENABLED="true"`.
 * L'API, service distinct, n'est pas concernée.
 */
export default function proxy(req: NextRequest): NextResponse {
  const gate = enforceLaunchProtection(req);
  if (gate) return gate;
  return NextResponse.next();
}

/** `null` si l'accès est autorisé, sinon 401 avec demande d'identifiants. */
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
 * Vérifie `Authorization: Basic …` contre les identifiants d'environnement.
 * Si le verrou est actif sans identifiants configurés, tout est refusé.
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

  // Le mot de passe peut contenir « : » : découpe sur le premier.
  const separator = decoded.indexOf(":");
  if (separator === -1) return false;

  return (
    decoded.slice(0, separator) === expectedUser && decoded.slice(separator + 1) === expectedPass
  );
}

export const config = {
  matcher: [
    // Pages uniquement : assets Next, favicon et fichiers à extension exclus.
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
