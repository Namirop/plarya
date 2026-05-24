# Web Patterns — Référence pour projets Node.js + TypeScript

Patterns et anti-patterns identifiés et appliqués sur le projet Plarya
(Next.js + Express + Prisma + Zod + pino). Ce fichier sert de référence
réutilisable pour les projets web futurs et de base à un skill Claude
dédié.

Lecture autonome : aucune connaissance préalable de Plarya requise. Les
références au code sont citées pour traçabilité, pas comme prérequis.

---

## Sommaire

1. [Architecture backend](#1-architecture-backend)
2. [Validation et typage](#2-validation-et-typage)
3. [Express + TypeScript](#3-express--typescript)
4. [Observabilité](#4-observabilité)
5. [Sécurité](#5-sécurité)
6. [Webhooks et idempotence](#6-webhooks-et-idempotence)
7. [À compléter au fil des audits](#7-à-compléter-au-fil-des-audits)

---

## 1. Architecture backend

### Pattern : séparation routes / services / lib

**Convention** :

```
backend/src/
├── routes/      ← Orchestration HTTP (parse request, appelle service, renvoie response)
├── services/    ← Logique métier (queries, règles, orchestration)
├── lib/         ← Utilitaires partagés (prisma, logger, helpers transverses)
├── middleware/  ← Express middlewares (auth, validate, rate-limit)
└── validators/  ← Schemas Zod (source de vérité des shapes)
```

**Règles** :

- Les routes contiennent UNIQUEMENT :
  - Extraction des inputs depuis `req`
  - Appel d'un service
  - Sérialisation HTTP (status code + JSON)
  - Mapping des erreurs métier vers HTTP (via un helper centralisé)
- Les services contiennent la logique métier :
  - Queries Prisma complexes
  - Règles métier (ex: auto-deflag, calculs, validations métier)
  - Orchestration de plusieurs étapes / transactions
- Les services **ne connaissent pas Express** : ils prennent des
  paramètres typés et retournent des données ou throw des erreurs.

#### Avant (route épaisse, ~65 lignes)

```ts
// routes/pronos.ts — tout dans le handler
router.post(
  "/",
  authMiddleware,
  expertMiddleware,
  validate(createPronoSchema),
  async (req, res) => {
    try {
      const expert = await prisma.expert.findUnique({
        where: { userId: req.user!.userId },
        select: { id: true },
      });
      if (!expert) {
        res.status(404).json({ error: "Profil expert introuvable" });
        return;
      }

      const { bookmakerOdds, ...pronoData } = req.body;
      if (pronoData.isFeatured) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        await prisma.prono.updateMany({
          where: { expertId: expert.id, isFeatured: true, createdAt: { gte: todayStart } },
          data: { isFeatured: false },
        });
      }

      const prono = await prisma.prono.create({
        data: {
          expertId: expert.id,
          matchName: pronoData.matchName,
          // … 10 champs ré-énumérés à la main
          bookmakerOdds:
            bookmakerOdds && bookmakerOdds.length > 0
              ? { create: bookmakerOdds.map((bo: { bookmakerId: string; odds: number }) => bo) }
              : undefined,
        },
        include: {
          /* gros include */
        },
      });

      res.status(201).json(prono);
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur" }); // ← err swallowed
    }
  },
);
```

#### Après (route mince + service)

```ts
// services/prono-service.ts
export async function publishProno(expertId: string, data: CreatePronoInput) {
  if (data.isFeatured) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    await prisma.prono.updateMany({
      where: { expertId, isFeatured: true, createdAt: { gte: todayStart } },
      data: { isFeatured: false },
    });
  }

  const { bookmakerOdds, startTime, matchDate, ...pronoData } = data;
  return prisma.prono.create({
    data: {
      expertId,
      ...pronoData,
      startTime: new Date(startTime),
      matchDate: matchDate ? new Date(matchDate) : undefined,
      ...(bookmakerOdds?.length ? { bookmakerOdds: { create: bookmakerOdds } } : {}),
    },
    include: bookmakerOddsInclude,
  });
}

// routes/pronos.ts — route mince
router.post(
  "/",
  authMiddleware,
  expertMiddleware,
  validate(createPronoSchema),
  async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const expert = await getExpertByUserIdOrThrow(authReq.user.userId);
      const prono = await publishProno(expert.id, req.body);
      res.status(201).json(prono);
    } catch (err) {
      handleError(err, res, "POST /pronos");
    }
  },
);
```

**Pourquoi c'est important** :

- **Testabilité** : `publishProno()` est testable sans monter Express
  (juste une DB de test). Tester un handler oblige à mocker req/res.
- **Réutilisabilité** : un cron, un autre service, ou un job peuvent
  appeler `publishProno()` directement. Si la logique est dans la
  route, il faudrait re-coder le même bloc.
- **Lisibilité** : la route lit comme un sommaire ("prend l'expert,
  publie le prono, renvoie 201"). La complexité descend d'un cran.
- **Cohérence** : toutes les règles métier d'un domaine (`prono.*`)
  vivent au même endroit. Un dev qui cherche "comment fonctionne la
  publication" lit `prono-service.ts`, pas N handlers.

**Quand l'éviter** : pour les routes purement CRUD triviales sans
règle métier (ex: `GET /bookmakers` qui ne fait qu'un `findMany` +
cache HTTP), introduire un service est du bruit. Règle pragmatique :
si la route a >15 lignes de logique ou >1 règle métier, extraire.

---

### Pattern : erreurs métier typées (classes vs strings)

Les services throw des erreurs métier — pas des strings, pas des objets
ad hoc. Une hiérarchie de classes permet au handler de mapper sur
HTTP en une ligne, et au code de tests de matcher avec `instanceof`.

#### Avant

```ts
// services/prono-service.ts
if (!expert) {
  return { error: "not_found", message: "Profil expert introuvable" };
}
```

```ts
// routes/pronos.ts
const result = await getExpert(userId);
if ("error" in result) {
  if (result.error === "not_found") res.status(404).json({ error: result.message });
  else res.status(500).json({ error: "Erreur" });
  return;
}
```

#### Après

```ts
// services/errors.ts
export abstract class ServiceError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Hiérarchie HTTP — une classe par status code "famille"
export class BadRequestError extends ServiceError {
  readonly code = "bad_request";
  readonly httpStatus = 400;
}
export class UnauthorizedError extends ServiceError {
  readonly code = "unauthorized";
  readonly httpStatus = 401;
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

// Erreurs domaine — sous-classer pour un mapping gratuit
export class ExpertProfileNotFoundError extends NotFoundError {
  constructor() {
    super("Profil expert introuvable");
  }
}
export class PseudoTakenError extends BadRequestError {
  constructor() {
    super("Ce pseudo est déjà pris");
  }
}
export class EmailAlreadyUsedError extends ConflictError {
  constructor() {
    super("Email déjà utilisé");
  }
}
```

**Distinction 400 vs 409** : un nom historiquement piégeur. Convention
appliquée ici :

- **400 BadRequest** = état métier qui empêche l'action (pseudo déjà
  pris, day pass acheté trop tard, sub déjà active, etc.). C'est un
  problème côté caller mais pas une vraie collision.
- **409 Conflict** = vraie collision avec une ressource existante
  (email unique violé, version optimistic-locking, etc.).

Préserver le status code historique sur les routes existantes pour ne
pas casser le contrat API.

```ts
// services/prono-service.ts
if (!expert) throw new ExpertProfileNotFoundError();
```

```ts
// lib/http-errors.ts — mapping centralisé
export function handleError(err: unknown, res: Response, route: string): void {
  if (err instanceof ServiceError) {
    res.status(err.httpStatus).json({ error: err.message, code: err.code });
    return;
  }
  logger.error({ err, route }, "Unhandled error in route");
  res.status(500).json({ error: "Erreur serveur" });
}

// routes/pronos.ts
try {
  const prono = await publishProno(/* … */);
  res.status(201).json(prono);
} catch (err) {
  handleError(err, res, "POST /pronos");
}
```

**Pourquoi** :

- Un `instanceof ServiceError` survit à la minification (le `.code`
  d'un POJO peut être renommé par certains bundlers, pas le nom de
  classe via prototype chain).
- L'héritage donne le mapping HTTP gratuit : `NotFoundError → 404`
  pour TOUTES les erreurs métier "introuvable" sans répéter `404`.
- Le `code` (stable, snake_case) est exposé au client pour les tests
  d'intégration ("attendez code: 'not_found'") sans dépendre du
  message FR qui peut bouger.

---

### Pattern : consolider les checks d'autorisation dans la query principale

Quand une route lit une ressource ET vérifie un droit d'accès sur le
caller (sub active, ownership, etc.), faire UNE seule query Prisma
avec un `include` filtré plutôt que deux queries séquentielles.

#### Avant (2 round-trips DB)

```ts
const prono = await prisma.prono.findUnique({
  where: { id },
  include: { expert: { select: { userId: true } } },
});

if (!prono) throw new PronoNotFoundError();

if (!isOwner && !isAdmin) {
  // 2e round-trip — alors qu'on a déjà l'expertId
  const sub = await prisma.subscription.findFirst({
    where: {
      userId: caller.userId,
      expertId: prono.expertId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
  });
  if (!sub) throw new SubscriptionRequiredError();
}
```

Sur un endpoint chaud (page profil expert, consulté par tous les
abonnés), 2 queries = 2× la latence DB pour chaque hit.

#### Après (1 seul round-trip)

```ts
const prono = await prisma.prono.findUnique({
  where: { id },
  include: {
    expert: {
      select: {
        userId: true,
        subscriptions: {
          // where filtré au caller — Prisma génère un JOIN avec filter
          where: {
            userId: caller.userId,
            status: "ACTIVE",
            expiresAt: { gt: new Date() },
          },
          select: { id: true },
          take: 1, // existence seulement, pas besoin du contenu
        },
      },
    },
  },
});

if (!prono) throw new PronoNotFoundError();

const hasActiveSubscription = prono.expert.subscriptions.length > 0;
if (!isOwner && !isAdmin && !hasActiveSubscription) {
  throw new SubscriptionRequiredError();
}
```

**Pourquoi** :

- 1 query au lieu de 2 — gain net en latence côté API (round-trip DB
  économisé sur le chemin chaud).
- La jointure est indexée (FK `subscriptions.userId` + FK
  `subscriptions.expertId`), coût DB négligeable.
- Le `take: 1` + `select: { id }` minimise le payload : on ne charge
  qu'un row vide minimal, juste pour tester l'existence.
- La logique reste lisible : "donne-moi le prono ET ses subs filtrées
  au caller" est une intention unique exprimée en une query.

**Quand l'éviter** :

- Si le check d'autorisation est rare (admin-only route accédée
  10×/jour), la query plate reste plus lisible.
- Si l'include filtré complique trop la query (3+ niveaux imbriqués,
  conditions exotiques), garder séparé. Lisibilité > micro-optim.

**Variante owner-OR-subscriber** : quand l'autorisation accepte
plusieurs voies (propriétaire OU abonné), Prisma ne peut pas
exprimer "OR sur une jointure conditionnelle" en une query. Solution :
inclure la sub ET le `expert.userId` (déjà nécessaire pour l'owner
check), évaluer les deux conditions en JS sur le résultat.

---

### Pattern : middleware chain (auth → role → validation → handler)

Ordre canonique d'une route protégée + validée :

```ts
router.post(
  "/pronos/:id/result",
  authMiddleware, // 1. Authentification (401 si KO)
  expertMiddleware, // 2. Autorisation rôle (403 si KO)
  validateParams(pronoIdParamsSchema), // 3. Validation params (400 si KO)
  validate(updateResultSchema), // 4. Validation body (400 si KO)
  async (req, res) => {
    /* handler */
  }, // 5. Logique métier
);
```

**Pourquoi cet ordre** :

- Auth d'abord : un user non authentifié ne doit pas gaspiller de cycles
  CPU sur la validation Zod.
- Role ensuite : un user authentifié mais non autorisé reçoit 403
  avant qu'on ait lu le body.
- Validation params avant body : les params arrivent en premier dans
  l'URL ; rejeter un ID malformé avant de parser un gros JSON.
- Handler en dernier : reçoit des données 100% validées et typées.

---

## 2. Validation et typage

### Pattern : Zod comme source unique de vérité (z.infer)

Les schemas Zod définissent **à la fois** la validation runtime ET le
type TypeScript. Ne jamais redéclarer un type qui existe déjà dans un
schema.

#### Avant (anti-pattern : redéclaration inline)

```ts
// validators/prono.ts
const bookmakerOddsItemSchema = z.object({
  bookmakerId: z.string().min(1),
  odds: z.number().positive(),
});

// routes/pronos.ts
bookmakerOdds.map((bo: { bookmakerId: string; odds: number }) => /* … */)
//             └─ type redéclaré inline, désynchronisé du schema
```

Si le schema ajoute un champ `currency`, le `.map()` ne le voit pas →
type incomplet, bug silencieux.

#### Après

```ts
// validators/prono.ts
const bookmakerOddsItemSchema = z.object({
  bookmakerId: z.string().min(1),
  odds: z.number().positive(),
});

export const createPronoSchema = z.object({
  /* … */
  bookmakerOdds: z.array(bookmakerOddsItemSchema).optional(),
});

// Types inférés — source unique de vérité
export type CreatePronoInput = z.infer<typeof createPronoSchema>;
export type BookmakerOddsItem = z.infer<typeof bookmakerOddsItemSchema>;
```

```ts
// services/prono-service.ts
import type { CreatePronoInput } from "../validators/prono";

export async function publishProno(expertId: string, data: CreatePronoInput) {
  // bookmakerOdds est typé automatiquement depuis le schema
  const { bookmakerOdds, ...rest } = data;
}
```

**Règle** : chaque validateur exporte les types via `z.infer`. Les
services et handlers consomment ces types — jamais de redéclaration.

---

### Pattern : types de retour services via `Prisma.<Model>GetPayload`

Les services qui font des queries Prisma avec `include` doivent
exposer le type EXACT du payload retourné — pas `unknown`, pas
`Prisma.Prono` (qui ignore les relations).

#### Avant

```ts
export async function publishProno(...): Promise<unknown> { ... }
```

Problème : casse le typage côté caller. `res.json(prono)` accepte
n'importe quoi, l'accès à `prono.matchName` depuis une route ou un
autre service n'est plus type-checké, et l'IDE perd l'autocomplete
sur les relations.

#### Après

```ts
import { Prisma, type Prono } from "../generated/prisma/client";

export const bookmakerOddsInclude = {
  bookmakerOdds: {
    include: {
      bookmaker: { include: { affiliateLinks: true } },
    },
  },
} as const;

// Type exact incluant les relations
export type PronoWithBookmakers = Prisma.PronoGetPayload<{
  include: typeof bookmakerOddsInclude;
}>;

export async function publishProno(
  expertId: string,
  data: CreatePronoInput,
): Promise<PronoWithBookmakers> {
  return prisma.prono.create({
    data: { /* … */ },
    include: bookmakerOddsInclude,
  });
}

// Pour un update sans include particulier : juste le type modèle
export async function updatePronoResult(
  pronoId: string,
  data: UpdateResultInput,
): Promise<Prono> {
  return prisma.prono.update({ where: { id: pronoId }, data });
}
```

**Pourquoi** :

- `Prisma.<Model>GetPayload<{ include: typeof X }>` génère le type
  EXACT incluant les relations imbriquées. Renommer un champ dans le
  schema Prisma propage automatiquement.
- `as const` sur l'include est requis pour préserver la shape
  littérale — sans lui, TS widen vers `{ [key: string]: unknown }` et
  `GetPayload` ne sait plus quoi inclure.
- Le type devient un **contrat exporté** réutilisable par les callers
  (routes, autres services, tests). Le changement d'include est un
  changement de contrat → visible à la review.
- Pour les opérations sans include, importer directement le type
  modèle (`type Prono`) suffit.

**Variante pour les includes dynamiques** (where filter qui dépend
d'un param caller, cf. consolidation queries §1) : décrire la SHAPE
des rows dans le type, le WHERE n'affecte pas le shape :

```ts
export type PronoDetailPayload = Prisma.PronoGetPayload<{
  include: {
    expert: {
      select: {
        userId: true;
        pseudo: true;
        subscriptions: { select: { id: true } }; // shape, pas where
      };
    };
    bookmakerOdds: typeof bookmakerOddsInclude.bookmakerOdds;
  };
}>;
```

---

### Pattern : middleware validate générique typé

Le middleware `validate(schema)` parse `req.body` ET propage le type
inféré au handler via génériques.

```ts
// middleware/validate.ts
import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema, type z } from "zod";

export function validate<T extends ZodSchema>(schema: T) {
  return (req: Request<unknown, unknown, z.infer<T>>, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: "Validation échouée",
          details: err.issues.map((e) => ({
            field: e.path.map(String).join("."),
            message: e.message,
          })),
        });
        return;
      }
      next(err);
    }
  };
}
```

**Le param `T extends ZodSchema`** est la clé : sans génériques, on
typerait `schema: ZodSchema` et `z.infer<typeof schema>` donnerait
`unknown`. Avec `T extends ZodSchema`, le compilateur retient le
schéma EXACT passé en argument → `z.infer<T>` donne la shape concrète.

#### Symétrique pour les params : validateParams

```ts
// middleware/validate-params.ts
export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request<z.infer<T>>, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as typeof req.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: "Paramètres de route invalides",
          details: err.issues.map((e) => ({
            field: e.path.map(String).join("."),
            message: e.message,
          })),
        });
        return;
      }
      next(err);
    }
  };
}
```

Bénéfice secondaire : Zod peut valider qu'un `:id` est un CUID Prisma
valide → filtre les requêtes malformées avant d'atteindre la DB.

```ts
export const pronoIdParamsSchema = z.object({
  id: z.string().cuid("ID prono invalide"),
});
```

---

### Anti-pattern : casts inline `as` superflus

```ts
const id = req.params.id as string;
```

**Problème** : `req.params.id` est DÉJÀ typé `string` par Express
(`ParamsDictionary`). Le cast est inutile et masque la vraie
opportunité : valider la SHAPE de l'ID.

**Fix** : utiliser `validateParams(schema)` (cf. ci-dessus) ; le cast
disparaît ET on obtient la validation runtime.

```ts
// Avant
const id = req.params.id as string;
const prono = await prisma.prono.findUnique({ where: { id } });

// Après
router.get("/:id", validateParams(pronoIdParamsSchema), async (req, res) => {
  const { id } = req.params;
  const prono = await prisma.prono.findUnique({ where: { id } });
});
```

---

## 3. Express + TypeScript

### Pattern : déclaration globale Request.user + AuthenticatedRequest

```ts
// middleware/auth.ts
import type { UserRole } from "../generated/prisma/enums";

export interface SessionUser {
  userId: string;
  role: UserRole; // ← enum Prisma, pas string
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser; // optional : middlewares non-auth ne définissent pas user
    }
  }
}

// Type narrowing pour les handlers placés derrière authMiddleware
export interface AuthenticatedRequest extends Request {
  user: SessionUser; // non-optional : authMiddleware a garanti la présence
}
```

---

### Anti-pattern : non-null assertions `req.user!`

```ts
// Anti-pattern
where: {
  userId: req.user!.userId;
}
//                      ^^^ le ! masque le fait que TS ne peut pas garantir user
```

**Pourquoi c'est mauvais** :

- Si un dev oublie `authMiddleware` sur une route, le `!` ment au
  compilateur et l'app crash au runtime (`Cannot read 'userId' of undefined`).
- Les `!` se multiplient (`req.user!.userId`, `req.user!.role`,
  `req.user!.userId` 5x sur la même route).

**Fix** : un cast UNIQUE en début de handler via `AuthenticatedRequest`.

```ts
// Après
router.post("/", authMiddleware, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.userId; // pas de !, type-checked
  const role = authReq.user.role; // pas de !
  // …
});
```

**Le cast reste un cast** — mais il est sémantiquement honnête ("le
middleware a garanti que user est défini, je communique l'info au
compilateur") et **une seule fois** par handler, vs 5+ `!` dispersés.

**Étape suivante (V2)** : un helper qui combine middleware + typing
automatique :

```ts
type AuthHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => unknown;

export function authRoute(handler: AuthHandler) {
  return [authMiddleware, handler] as const;
}
// usage: router.post("/", ...authRoute(async (req, res) => { /* req.user is typed */ }));
```

À considérer quand la duplication du cast `as AuthenticatedRequest`
dépasse ~15 routes.

---

### Pattern : style async/await uniforme (pas de .then/.catch)

#### Avant

```ts
export function authMiddleware(req, res, next) {
  verifySession(token)
    .then((sessionUser) => {
      if (!sessionUser) {
        res.status(401).json({
          /* … */
        });
        return;
      }
      req.user = sessionUser;
      next();
    })
    .catch(() =>
      res.status(401).json({
        /* … */
      }),
    ); // ← err swallowed
}
```

#### Après

```ts
export async function authMiddleware(req, res, next) {
  try {
    const sessionUser = await verifySession(token);
    if (!sessionUser) {
      res.status(401).json({
        /* … */
      });
      return;
    }
    req.user = sessionUser;
    next();
  } catch (err) {
    logger.error({ err }, "Auth middleware failed");
    res.status(401).json({ error: "Erreur d'authentification" });
  }
}
```

**Pourquoi** :

- Style uniforme dans toute la codebase (async/await partout).
- Le `try/catch` capture les throws synchrones DANS le handler (que
  le `.catch()` d'une chaîne Promise ne capture pas si l'erreur est
  posée avant le `await`).
- Plus facile à debugger (stack trace lisible).

**Quand garder `.catch()`** : pour les cleanups best-effort fire-and-
forget qu'on ne veut pas faire bloquer la route, ex :

```ts
// magic-link.ts — cleanup d'une session expirée
await prisma.session.delete({ where: { id: session.id } }).catch(() => {
  /* swallow, cron de cleanup ramassera */
});
```

C'est une exception explicite, commentée, pas un style général.

---

### Pattern : enum Prisma pour les rôles, pas string

#### Avant

```ts
export interface SessionUser {
  userId: string;
  role: string; // ← n'importe quelle string passe
}

if (req.user!.role === "EXPRT") {
  /* typo silencieuse, jamais vrai */
}
```

#### Après

```ts
import type { UserRole } from "@prisma/client"; // ou ../generated/prisma/enums

export interface SessionUser {
  userId: string;
  role: UserRole; // ← "USER" | "EXPERT" | "ADMIN"
}

if (req.user!.role === "EXPRT") {
  /* TS error: Type '"EXPRT"' is not assignable */
}
```

**Pourquoi** : la source de vérité des rôles est dans `schema.prisma`.
Importer le type généré garantit que la TS, la DB, et l'auth sont
toujours alignés. Si on renomme `EXPERT → CREATOR` dans Prisma, tous
les sites d'usage cassent au build (pas à 3h du mat' en prod).

---

## 4. Observabilité

### Pattern : pino logger structuré

```ts
// lib/logger.ts
import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  ...(isProd
    ? {} // JSON brut en prod (ingestion Datadog/Logflare)
    : {
        transport: { target: "pino-pretty", options: { colorize: true } },
      }),
});

// PII : NE JAMAIS logger d'email brut. Masquer via helper.
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "<none>";
  const [local, domain] = email.split("@");
  if (!domain) return "<invalid>";
  const masked = local.length <= 1 ? local : `${local[0]}***`;
  return `${masked}@${domain}`;
}
```

**Convention de log** : objet d'abord, message ensuite.

```ts
// ✅ Bon : champs interrogeables séparément côté agrégateur
logger.error({ err, route: "POST /pronos", userId }, "Failed to create prono");

// ❌ Mauvais : message-only, pas de structure
logger.error(`Failed to create prono for user ${userId}: ${err.message}`);
```

**Child loggers** pour les contextes répétitifs :

```ts
const webhookLogger = logger.child({ context: "webhook" });
webhookLogger.info({ eventId }, "Processing"); // contexte "webhook" auto-injecté
```

---

### Anti-pattern : try/catch sans log

#### Avant

```ts
try {
  await doSomething();
  res.json(result);
} catch (err) {
  res.status(500).json({ error: "Erreur serveur" });
  //  └─ err disparaît dans le vide, debug impossible en prod
}
```

#### Après

```ts
try {
  await doSomething();
  res.json(result);
} catch (err) {
  logger.error({ err, route: "POST /pronos" }, "Failed to create prono");
  res.status(500).json({ error: "Erreur serveur" });
}
```

**Règle** : tout `catch` qui renvoie une 5xx DOIT logger l'erreur
avant. Le `route` (ou contexte équivalent) permet de filtrer côté
agrégateur — sans lui, on a juste "une erreur s'est produite" sans
savoir où.

**Variante** : déléguer à un helper centralisé (cf. `handleError` ci-
dessus) pour ne pas répéter le couple log + 500 sur chaque route.

**Exception : catch silencieux explicite** — quand on a une vraie
raison de swallow l'erreur (best-effort cleanup non-bloquant), le
commenter explicitement :

```ts
await prisma.session.delete({ where: { id: sessionId } }).catch(() => {
  /* swallow — best-effort cleanup, cron ramasse les expirés */
});
```

Le commentaire fait foi : sans lui, c'est un anti-pattern.

---

## 5. Sécurité

### Pattern : middleware d'auth en chaîne (auth → role)

Séparer authentification (qui es-tu ?) et autorisation (as-tu le
droit ?) en deux middlewares composables.

```ts
// middleware/auth.ts — vérifie un session token, attache req.user
export async function authMiddleware(req, res, next) {
  /* … */
}

// middleware/admin.ts — vérifie req.user.role === "ADMIN"
export function adminMiddleware(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({ error: "Accès réservé aux admins" });
    return;
  }
  next();
}

// Chaîne en route
router.use("/admin", authMiddleware, adminMiddleware);
```

**Pourquoi** : un middleware = une responsabilité. On peut composer
`authMiddleware + expertMiddleware` pour /dashboard et `authMiddleware

- adminMiddleware` pour /admin sans dupliquer la logique de session.

---

### Pattern : validation des params via Zod

Cf. `validateParams(schema)` ci-dessus. Bénéfice double :

1. Sécurité : un ID malformé est rejeté en 400 avant d'atteindre Prisma.
2. Type safety : `req.params.id` est garanti string non-vide après
   parse.

---

### Pattern : CSRF double-submit cookie

```ts
// Cookie csrf_token non-httpOnly (lisible JS frontend)
// Header X-CSRF-Token requis sur méthodes mutantes (POST/PATCH/PUT/DELETE)
// Whitelist : GET/HEAD/OPTIONS, /webhooks/stripe (signature Stripe)
```

Frontend injecte automatiquement le header via un wrapper `apiFetch`
qui lit le cookie et le pose dans `X-CSRF-Token`. Le backend compare
cookie vs header — un attaquant cross-origin ne peut pas lire le
cookie (même origin policy) donc ne peut pas forger le header.

---

### Pattern : rate-limiters par endpoint

`express-rate-limit` configuré PAR endpoint sensible plutôt qu'un
limiter global.

```ts
const magicLinkRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Trop de demandes" },
});

router.post("/request-magic-link", magicLinkRequestLimiter /* … */);
```

**Bornes utiles** :

- `/auth/request-magic-link` : 5/15min/IP (anti-spam emails)
- `/auth/me/export` : 1/24h/IP (anti-DOS export volumineux)
- `/checkout` : 5/min/IP
- View counter : 1/h/(IP+resourceId) — utiliser `ipKeyGenerator` pour
  IPv6-safe.

---

### Pattern : webhooks signature-verified + idempotents

```ts
// 1. Signature verification (rejette 400 si bad signature)
const event = stripe.webhooks.constructEvent(req.body, sig, SECRET);

// 2. Idempotence event-level (table StripeWebhookEvent stocke event.id)
const already = await prisma.stripeWebhookEvent.findUnique({ where: { id: event.id } });
if (already) return res.json({ received: true });

// 3. Process + mark processed DANS UNE TRANSACTION
await prisma.$transaction(async (tx) => {
  // logique métier
  await tx.stripeWebhookEvent.create({ data: { id: event.id /* … */ } });
});
```

**Pourquoi la transaction** : si le process échoue après l'écriture
métier mais avant le `markEventProcessed`, Stripe retentera l'event
→ double insert. La transaction garantit atomicité.

---

## 6. Webhooks et idempotence

### Pattern : webhooks Stripe — signature + idempotence event-level

Tout webhook tiers (Stripe, Resend, GitHub, etc.) doit être conçu en
partant du principe qu'il peut être **rejoué**. Les fournisseurs
retentent les events sur 500/timeout. Sans idempotence, un même
paiement peut créer 2 Subscriptions.

```ts
// routes/webhooks.ts — orchestration HTTP
router.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;

  // 1. Signature verification → 400 si invalide (Stripe ne retry pas)
  let event: StripeEvent;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, SECRET);
  } catch (err) {
    logger.error({ err }, "Signature verification failed");
    res.status(400).send("Signature invalide");
    return;
  }

  // 2. Idempotence event-level — skip si déjà traité (table SQL avec
  //    event.id en PK). Stripe stoppe les retries sur 200.
  if (await isEventAlreadyProcessed(event.id)) {
    res.json({ received: true });
    return;
  }

  // 3. Dispatch + transaction interne
  // PAS de try/catch global : un throw → 500 → Stripe retry
  await processStripeEvent(event);
  res.json({ received: true });
});
```

```ts
// services/billing-service.ts — handler avec markEventProcessed dans la transaction
await prisma.$transaction(async (tx) => {
  const existing = await tx.subscription.findFirst({
    where: { stripeSessionId: session.id },
  });
  if (existing) {
    // Application-level idempotence (defense in depth)
    await markEventProcessed(tx, event);
    return;
  }
  await tx.subscription.create({
    /* … */
  });
  await markEventProcessed(tx, event); // ← dans la même transaction
});
```

**Trois niveaux de défense** :

1. **Signature verification** : payload truqué rejeté en 400.
2. **Event-level idempotence** (table `stripeWebhookEvent` avec
   event.id en PK) : Stripe rejoue → 200 silencieux.
3. **Application-level idempotence** dans la transaction : un check
   "existing" avant l'insert métier protège contre des retries qui
   passeraient le check niveau 2 (improbable mais defensive).

**Pourquoi pas de try/catch global** : un crash métier doit faire
remonter 500 pour déclencher le retry Stripe (TTL 3 jours par défaut).
Si on swallow l'erreur en 200, Stripe arrête de retenter et l'event
est perdu. Les transactions garantissent atomicité : soit la mutation
ET le markEventProcessed passent, soit rien.

---

### Pattern : transaction atomique pour mutation + audit log

Quand une mutation métier doit s'accompagner d'une trace immuable
(audit, idempotence, compteur), wrap les deux dans une transaction :

```ts
await prisma.$transaction(async (tx) => {
  await tx.subscription.create({
    /* mutation métier */
  });
  await markEventProcessed(tx, event); // audit
});
```

Sans la transaction, le crash entre les deux opérations laisse un état
incohérent (mutation appliquée + pas de trace → l'event re-traité crée
un doublon). Avec, Postgres garantit atomicité.

**Le client `tx` partage l'API de `prisma`** — les helpers utilitaires
(`markEventProcessed`) doivent donc accepter soit `prisma`, soit `tx` :

```ts
type EventStoreClient = Pick<typeof prisma, "stripeWebhookEvent">;

export async function markEventProcessed(
  client: EventStoreClient,
  event: StripeEvent,
): Promise<void> {
  await client.stripeWebhookEvent.create({
    /* … */
  });
}
```

`Pick<typeof prisma, "X">` extrait UNIQUEMENT les modèles utilisés.
Une signature laxiste (`PrismaClient | Prisma.TransactionClient`)
fonctionne mais est plus lourde et accepte tout. `Pick` est le minimum
nécessaire.

---

### Pattern : réutilisation des helpers de service inter-callers

Quand une même opération est déclenchée depuis plusieurs endroits
(route HTTP + cron + autre service), elle DOIT vivre dans un service
et être réutilisée — pas duplicée.

#### Avant (duplication route ↔ cron)

```ts
// routes/auth.ts — DELETE /me, branche soft delete immédiat
await prisma.$transaction(async (tx) => {
  await tx.expert.update({ where: { id: expert.id }, data: { deletedAt: now } });
  await tx.user.update({
    /* … */
  });
  await tx.deletedEmailCooldown.create({
    /* … */
  });
  await tx.magicLink.deleteMany({
    /* … */
  });
  await tx.session.deleteMany({
    /* … */
  });
});

// lib/cron.ts — autoDeletePendingExperts (MÊME bloc copié)
await prisma.$transaction(async (tx) => {
  await tx.expert.update({
    /* … */
  });
  await tx.user.update({
    /* … */
  });
  // … exactement le même code
});
```

#### Après (helper service unique)

```ts
// services/account-service.ts
export async function softDeleteUserNow(input: {
  userId: string;
  email: string;
  expertId: string | null;
  now: Date;
}): Promise<void> {
  const cooldownExpiresAt = new Date(input.now.getTime() + COOLDOWN_MS);
  await prisma.$transaction(async (tx) => {
    if (input.expertId) {
      await tx.expert.update({
        /* … */
      });
    }
    await tx.user.update({
      /* … */
    });
    await tx.deletedEmailCooldown.create({
      /* … */
    });
    await tx.magicLink.deleteMany({
      /* … */
    });
    await tx.session.deleteMany({
      /* … */
    });
  });
}

// routes/auth.ts ET lib/cron.ts consomment tous deux :
await softDeleteUserNow({ userId, email, expertId, now });
```

**Pourquoi** : sans dédup, les deux chemins divergent au fil des
refactos (un ajoute un wipe de cache, l'autre non). Garantie de
cohérence + un seul site à tester.

---

### Pattern : 200 OK générique anti-énumération

Pour les endpoints sensibles à l'énumération de comptes (login,
password reset, magic-link request), renvoyer la **même réponse** que
l'email existe ou non.

```ts
// services/auth-service.ts — log discriminé en INTERNE
if (cooldown) {
  logger.warn({ email: maskEmail(email) }, "Magic-link blocked: cooldown");
  return { delivered: false, reason: "cooldown" };
}
// envoyer le mail
return { delivered: true };

// routes/auth.ts — réponse identique aux deux cas
await requestMagicLink(email, { ip });
res.json({
  message: "Si un compte existe avec cet email, un lien de connexion a été envoyé.",
});
```

**Pourquoi** : un endpoint qui renvoie "email inconnu" vs "email
trouvé" permet à un attaquant d'énumérer les comptes en place
(brute-force sur une liste d'emails leakés). La réponse uniforme +
le log interne (avec maskEmail) donnent observabilité sans leak.

---

### Pattern : helper handleError avec fallback message custom

Le helper centralisé peut accepter un fallbackMessage optionnel pour
préserver des messages user-facing historiques sur certaines routes :

```ts
export function handleError(
  err: unknown,
  res: Response,
  route: string,
  fallbackMessage = "Erreur serveur",
): void {
  if (err instanceof ServiceError) {
    res.status(err.httpStatus).json({ error: err.message, code: err.code });
    return;
  }
  logger.error({ err, route }, "Unhandled error in route");
  res.status(500).json({ error: fallbackMessage });
}

// Usage avec message custom préservé
handleError(err, res, "POST /checkout/create-session", "Erreur lors de la création du paiement");
```

Pourquoi : un changement de message d'erreur côté API EST un changement
de contrat. Le fallback custom permet de migrer vers un helper
centralisé SANS casser les frontends qui matchent peut-être sur ce
message exact.

---

## 7. À compléter au fil des audits

Section ouverte pour les patterns à ajouter au fur et à mesure des
nouveaux fichiers audités. Structure attendue pour chaque ajout :

````markdown
### Pattern : <nom du pattern>

#### Avant

```ts
// code anti-pattern
```
````

#### Après

```ts
// code corrigé
```

**Pourquoi** : <justification>

```

### Patterns observés mais pas encore documentés (à creuser)

- **Prisma transactions et race conditions** — quand utiliser `$transaction`
  vs application-level idempotence vs both.
- **Soft delete + cooldown post-suppression** — pattern RGPD avec table
  `DeletedEmailCooldown` qui empêche la recréation immédiate d'un compte.
- **Cache HTTP côté backend** (`Cache-Control: public, s-maxage=...,
  stale-while-revalidate=...`) sur endpoints publics — quand l'activer
  et avec quelles bornes.
- **Email retry exponentiel** (cf. `lib/resend.ts`) — pattern wrapper
  fire-and-forget avec backoff et distinction erreur permanente vs
  transient.
- **Frontend** : pas encore couvert dans ce document — server
  components Next.js, hooks de fetch (`use-user`, `use-experts`),
  patterns de modale avec focus trap + scroll-lock.

À documenter quand on aura accumulé assez d'exemples concrets.
```
