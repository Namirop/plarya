/**
 * Erreurs métier des services, traduites en HTTP par handleError.
 *
 * Chaque sous-classe porte un `code` stable (snake_case) qui permet au
 * frontend de distinguer deux erreurs de même statut sans lire le message
 * (en français). Les classes de base (400, 401, 403, 404, 409) restent
 * utilisables directement pour les cas ponctuels.
 */

export abstract class ServiceError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(message: string, options?: { cause?: unknown }) {
    // `cause` conserve l'erreur d'origine (Prisma, Stripe…) et sa stack.
    super(message, options);
    this.name = this.constructor.name;
  }
}

// ─── Classes de base par statut HTTP ───────────────────────────────
// `code: string` explicite : sans l'annotation, TypeScript infère le type
// littéral et refuse que les sous-classes le redéfinissent.

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

// ─── Erreurs métier (statut hérité de la classe parente) ───────────

// 404
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

// 403
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
export class ExpertSubscriptionInactiveError extends ForbiddenError {
  readonly code = "expert_subscription_inactive";
  constructor() {
    super("Ton abonnement expert n'est plus actif : renouvelle-le pour publier.");
  }
}
export class PronoSubscriptionRequiredError extends ForbiddenError {
  readonly code = "prono_subscription_required";
  constructor() {
    super("Abonnement requis pour voir les pronos");
  }
}

// 409
export class EmailAlreadyUsedError extends ConflictError {
  readonly code = "email_already_used";
  constructor() {
    super("Email déjà utilisé");
  }
}

// 400 : état métier qui empêche l'action
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
export class ExpertUnavailableError extends BadRequestError {
  readonly code = "expert_unavailable";
  constructor() {
    super("Cet expert ne prend plus de nouveaux abonnés. Choisis un autre expert.");
  }
}
export class SubscriptionNotCancellableError extends BadRequestError {
  readonly code = "subscription_not_cancellable";
  constructor() {
    super("Cet abonnement ne peut pas être résilié en ligne. Écris-nous à contact@plarya.com.");
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

// Paiement anonyme sans email : donnée manquante (400), pas un défaut
// d'authentification (401) qui ferait réagir le client comme à une session
// expirée. Le frontend ouvre la saisie d'email sur `email_required`.
export class EmailRequiredError extends BadRequestError {
  readonly code = "email_required";
  constructor() {
    super("Email requis");
  }
}
