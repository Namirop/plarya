/**
 * Erreurs métier typées exposées par les services.
 *
 * Convention :
 *  - Chaque erreur expose un `code` stable (snake_case) que les
 *    handlers HTTP renvoient au client. Le `code` est DISCRIMINANT par
 *    sous-classe domaine — le frontend doit pouvoir distinguer deux
 *    erreurs partageant le même httpStatus sans matcher sur le message
 *    FR (cf. backend-patterns.md §"code discriminant").
 *  - Le `name` est aligné sur le nom de la classe pour faciliter le
 *    log (`logger.error({ err: { name: err.name, ... } })`).
 *  - Le message est en français côté API (cohérent avec le reste du
 *    backend), mais le `code` reste en anglais pour les outils
 *    d'observabilité.
 *
 * Hiérarchie HTTP :
 *    BadRequestError    400 — validation / état métier invalide
 *    UnauthorizedError  401 — pas authentifié
 *    ForbiddenError     403 — authentifié mais pas autorisé
 *    NotFoundError      404 — ressource inexistante (ou cachée)
 *    ConflictError      409 — collision avec une ressource existante
 *
 * Les classes pivot HTTP ci-dessus restent instanciables directement
 * (code générique "bad_request", etc.) pour les erreurs ad hoc qui ne
 * justifient pas une sous-classe domaine dédiée.
 *
 * Pourquoi des classes plutôt qu'un union type `"not_found" | "forbidden"` ?
 * Les classes permettent `err instanceof NotFoundError` dans le handler,
 * qui est plus lisible qu'un switch sur une property et survit aux
 * minifications. Une union type aurait imposé un check string par
 * comparaison de littéral, plus fragile.
 */

export abstract class ServiceError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(message: string, options?: { cause?: unknown }) {
    // Error.cause (ES2022 / Node 16.9+) propage l'erreur d'origine
    // (Prisma, Stripe, fetch…) sans perdre la stack. Voir
    // backend-patterns.md §"chaîner les erreurs externes avec Error.cause".
    super(message, options);
    this.name = this.constructor.name;
  }
}

// ─── Classes pivot HTTP ────────────────────────────────────────────
// Le `: string` explicite (vs juste `= "..."`) widen le type au type
// `string` plutôt qu'au littéral — autorise les sous-classes domaine
// à override avec un code discriminant. Sans cette annotation, TS
// narrow à la chaîne littérale et rejette tout override.

export class BadRequestError extends ServiceError {
  readonly code: string = "bad_request";
  readonly httpStatus = 400;
}

export class UnauthorizedError extends ServiceError {
  readonly code: string = "unauthorized";
  readonly httpStatus = 401;
}

export class ForbiddenError extends ServiceError {
  readonly code: string = "forbidden";
  readonly httpStatus = 403;
}

export class NotFoundError extends ServiceError {
  readonly code: string = "not_found";
  readonly httpStatus = 404;
}

export class ConflictError extends ServiceError {
  readonly code: string = "conflict";
  readonly httpStatus = 409;
}

// ─── Erreurs domaine ───────────────────────────────────────────────
// Chaque sous-classe override `code` pour être discriminante. Le
// httpStatus est hérité du pivot HTTP parent.

// Resource not found (404)
export class ExpertProfileNotFoundError extends NotFoundError {
  readonly code = "expert_profile_not_found";
  constructor() {
    super("Profil expert introuvable");
  }
}
export class ExpertNotFoundError extends NotFoundError {
  readonly code = "expert_not_found";
  constructor() {
    super("Expert introuvable");
  }
}
export class PronoNotFoundError extends NotFoundError {
  readonly code = "prono_not_found";
  constructor() {
    super("Prono introuvable");
  }
}
export class UserNotFoundError extends NotFoundError {
  readonly code = "user_not_found";
  constructor() {
    super("Utilisateur introuvable");
  }
}
export class NoDeletionToCancelError extends NotFoundError {
  readonly code = "no_deletion_to_cancel";
  constructor() {
    super("Aucune suppression à annuler");
  }
}

// Forbidden (403)
export class NotPronoOwnerError extends ForbiddenError {
  readonly code = "not_prono_owner";
  constructor() {
    super("Non autorisé");
  }
}
export class SubscriptionRequiredError extends ForbiddenError {
  readonly code = "subscription_required";
  constructor() {
    super("Abonnement requis");
  }
}
export class PronoSubscriptionRequiredError extends ForbiddenError {
  readonly code = "prono_subscription_required";
  constructor() {
    super("Abonnement requis pour voir les pronos");
  }
}

// Conflict (409) — vraie collision avec ressource existante
export class EmailAlreadyUsedError extends ConflictError {
  readonly code = "email_already_used";
  constructor() {
    super("Email déjà utilisé");
  }
}

// Bad request (400) — état métier qui empêche l'action
export class PseudoTakenError extends BadRequestError {
  readonly code = "pseudo_taken";
  constructor() {
    super("Ce pseudo est déjà pris");
  }
}
export class ExpertPendingDeletionError extends BadRequestError {
  readonly code = "expert_pending_deletion";
  constructor() {
    super("Cet expert ne prend plus de nouveaux abonnés. Choisis un autre expert.");
  }
}
export class NoUpcomingPronosError extends BadRequestError {
  readonly code = "no_upcoming_pronos";
  constructor() {
    super("Les analyses de cet expert sont déjà terminées pour aujourd'hui.");
  }
}
export class AlreadySubscribedError extends BadRequestError {
  readonly code = "already_subscribed";
  constructor() {
    super("Vous avez déjà un accès actif pour cet expert");
  }
}
export class AlreadyExpertError extends BadRequestError {
  readonly code = "already_expert";
  constructor() {
    super("Vous êtes déjà expert");
  }
}
export class DeletionAlreadyScheduledError extends BadRequestError {
  readonly code = "deletion_already_scheduled";
  constructor() {
    super("Une suppression est déjà programmée pour ton compte.");
  }
}
export class NoScheduledDeletionError extends BadRequestError {
  readonly code = "no_scheduled_deletion";
  constructor() {
    super("Aucune suppression programmée");
  }
}

// EmailRequiredError est un cas particulier : la route
// /checkout/create-session accepte deux voies d'identification —
// session authentifiée OU email dans le body (guest checkout). Quand
// aucune des deux n'est fournie, c'est un input manquant (400), PAS
// un échec d'authentification (401). Renvoyer 401 ici déclenche des
// intercepteurs HTTP côté client qui redirigent vers /login — ce qui
// n'est pas l'UX voulue. Le code "email_required" suffit au frontend
// pour ouvrir la modale email plutôt que rediriger.
export class EmailRequiredError extends BadRequestError {
  readonly code = "email_required";
  constructor() {
    super("Email requis");
  }
}
