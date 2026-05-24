/**
 * Erreurs métier typées exposées par les services.
 *
 * Convention :
 *  - Chaque erreur expose un `code` stable (snake_case) que les
 *    handlers HTTP peuvent mapper sur un status code et un message
 *    user-facing.
 *  - Le `name` est aligné sur le nom de la classe pour faciliter le
 *    log (`logger.error({ err: { name: err.name, ... } })`).
 *  - Le message est en français côté API (cohérent avec le reste du
 *    backend), mais le `code` reste en anglais pour les outils
 *    d'observabilité.
 *
 * Hiérarchie HTTP :
 *    BadRequestError    400 — validation / état métier invalide
 *    ForbiddenError     403 — authentifié mais pas autorisé
 *    NotFoundError      404 — ressource inexistante (ou cachée)
 *    ConflictError      409 — collision avec une ressource existante
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

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class BadRequestError extends ServiceError {
  readonly code = "bad_request";
  readonly httpStatus = 400;
}

export class ForbiddenError extends ServiceError {
  readonly code = "forbidden";
  readonly httpStatus = 403;
}

export class NotFoundError extends ServiceError {
  readonly code = "not_found";
  readonly httpStatus = 404;
}

export class ConflictError extends ServiceError {
  readonly code = "conflict";
  readonly httpStatus = 409;
}

// ─── Erreurs domaine ───────────────────────────────────────────────
// Sous-classer la base HTTP donne le mapping status code gratuit. Un
// handler peut log err.name + err.code pour distinguer les sous-types
// en monitoring.

// Resource not found
export class ExpertProfileNotFoundError extends NotFoundError {
  constructor() {
    super("Profil expert introuvable");
  }
}
export class ExpertNotFoundError extends NotFoundError {
  constructor() {
    super("Expert introuvable");
  }
}
export class PronoNotFoundError extends NotFoundError {
  constructor() {
    super("Prono introuvable");
  }
}
export class UserNotFoundError extends NotFoundError {
  constructor() {
    super("Utilisateur introuvable");
  }
}
export class NoDeletionToCancelError extends NotFoundError {
  constructor() {
    super("Aucune suppression à annuler");
  }
}

// Forbidden
export class NotPronoOwnerError extends ForbiddenError {
  constructor() {
    super("Non autorisé");
  }
}
export class SubscriptionRequiredError extends ForbiddenError {
  constructor() {
    super("Abonnement requis");
  }
}
export class PronoSubscriptionRequiredError extends ForbiddenError {
  constructor() {
    super("Abonnement requis pour voir les pronos");
  }
}

// Conflict (409) — vraie collision avec ressource existante
export class EmailAlreadyUsedError extends ConflictError {
  constructor() {
    super("Email déjà utilisé");
  }
}

// Bad request (400) — état métier qui empêche l'action
export class PseudoTakenError extends BadRequestError {
  constructor() {
    super("Ce pseudo est déjà pris");
  }
}
export class ExpertPendingDeletionError extends BadRequestError {
  constructor() {
    super("Cet expert ne prend plus de nouveaux abonnés. Choisis un autre expert.");
  }
}
export class NoUpcomingPronosError extends BadRequestError {
  constructor() {
    super("Les analyses de cet expert sont déjà terminées pour aujourd'hui.");
  }
}
export class AlreadySubscribedError extends BadRequestError {
  constructor() {
    super("Vous avez déjà un accès actif pour cet expert");
  }
}
export class AlreadyExpertError extends BadRequestError {
  constructor() {
    super("Vous êtes déjà expert");
  }
}
export class DeletionAlreadyScheduledError extends BadRequestError {
  constructor() {
    super("Une suppression est déjà programmée pour ton compte.");
  }
}
export class NoScheduledDeletionError extends BadRequestError {
  constructor() {
    super("Aucune suppression programmée");
  }
}

// Auth (401) — distinct de Forbidden : "tu n'es pas authentifié" vs
// "tu l'es mais pas autorisé". 401 doit s'accompagner d'un WWW-
// Authenticate header en théorie, mais en pratique pour une API JSON
// on retourne juste le code et le frontend redirige vers login.
export class UnauthorizedError extends ServiceError {
  readonly code = "unauthorized";
  readonly httpStatus = 401;
}

export class EmailRequiredError extends UnauthorizedError {
  constructor() {
    super("Email requis");
  }
}
