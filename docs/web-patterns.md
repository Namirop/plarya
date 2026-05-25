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
7. [Frontend — UI](#7-frontend--ui)
8. [À compléter au fil des audits](#8-à-compléter-au-fil-des-audits)

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

#### Sous-pattern : `code` discriminant par sous-classe domaine

Le `code` d'une sous-classe domaine doit être PLUS spécifique que
celui de son pivot HTTP parent — sinon le frontend ne peut pas
distinguer deux erreurs partageant le même status sans matcher sur le
message FR.

##### Anti-pattern

```ts
export class BadRequestError extends ServiceError {
  readonly code = "bad_request";
  readonly httpStatus = 400;
}

// Les deux sous-classes héritent code: "bad_request"
export class PseudoTakenError extends BadRequestError {
  constructor() { super("Ce pseudo est déjà pris"); }
}
export class AlreadyExpertError extends BadRequestError {
  constructor() { super("Vous êtes déjà expert"); }
}
```

Le frontend voit `{ code: "bad_request" }` dans les deux cas. Pour
distinguer "pseudo déjà pris" (highlight le champ pseudo) de "déjà
expert" (rediriger vers le dashboard), il doit matcher sur le message
FR — fragile, casse au moindre changement de wording.

##### Pattern

```ts
// Le pivot expose `code: string` (pas littéral) pour permettre l'override
export class BadRequestError extends ServiceError {
  readonly code: string = "bad_request"; // ← `: string` explicite
  readonly httpStatus = 400;
}

export class PseudoTakenError extends BadRequestError {
  readonly code = "pseudo_taken"; // ← override discriminant
  constructor() { super("Ce pseudo est déjà pris"); }
}
export class AlreadyExpertError extends BadRequestError {
  readonly code = "already_expert";
  constructor() { super("Vous êtes déjà expert"); }
}
```

Le frontend fait alors `if (data.code === "pseudo_taken") showField("pseudo")`
proprement, sans dépendre du wording FR.

**Détail TypeScript** : sans l'annotation `: string` explicite sur le
pivot, TS narrow le type de `code` à la chaîne littérale
`"bad_request"`, et les sous-classes ne peuvent plus override avec
une autre valeur (erreur TS2416). L'annotation widen au type `string`,
autorisant l'override.

**Convention de naming** : snake_case, descriptif, aligné sur le nom
de classe sans le suffixe `Error` (ex: `PseudoTakenError` →
`pseudo_taken`). Évite les codes numériques custom (`PLY-001`) qui
imposent une table de correspondance externe.

**Pourquoi** : le `code` existe précisément pour donner un identifiant
stable machine-readable. S'il duplique l'info du `httpStatus`, il ne
sert à rien. La discrimination doit se faire au niveau le plus fin où
le frontend a besoin d'agir différemment.

#### Sous-pattern : chaîner les erreurs externes avec `Error.cause`

Quand un service catch une erreur d'une lib externe (Prisma, Stripe,
fetch) et la rethrow en `ServiceError`, on perd la stack et le
contexte d'origine sans `cause`.

```ts
// Constructor base avec support cause (ES2022, Node 16.9+)
export abstract class ServiceError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

// Usage : préserver la cause Prisma
try {
  await prisma.user.create({ data: { email } });
} catch (err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    throw new EmailAlreadyUsedError({ cause: err });
    //                                ^^^^^^^^^^^^ propage stack Prisma
  }
  throw err;
}

// Le log structuré accède à la cause via err.cause :
logger.error({ err, cause: (err as Error).cause }, "Failed");
```

**Pourquoi** : la stack de l'erreur d'origine reste accessible via
`err.cause`, ce qui simplifie le debug en prod (les logs structurés
contiennent automatiquement le contexte Prisma / Stripe sans devoir
corréler manuellement). Dispo nativement depuis Node 16.9 / ES2022.

**Note rétro-compat** : les sous-classes domaine existantes
(`new EmailAlreadyUsedError()` sans args) restent valides — l'argument
`options` est optionnel. À ajouter au case par case quand le wrap
d'une erreur externe a du sens.

**Pré-requis tsconfig** : `"target": "ES2022"` (ou plus récent) pour
que TS connaisse l'option `cause` de `Error`. ES2020 → erreur TS2554
"Expected 0-1 arguments, but got 2".

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

## 7. Frontend — UI

### Pattern : police display réservée au marketing

Sur les projets premium qui mélangent landing pages éditoriales et UI
applicative (dashboards, modales, formulaires de gestion), il est
tentant d'utiliser une police display "à effet" (serif éditoriale, type
DM Serif Display, Playfair, Cormorant) **partout** où il y a un titre.
C'est une erreur : la police perd son effet éditorial dès qu'elle est
appliquée à des éléments utilitaires.

#### Symptômes du sur-usage

- Titres de modales (LoginModal, ConfirmModal) en serif → la modale
  ressemble à une carte de visite, pas à un dialogue système.
- Titres internes de dashboard ("Mes ventes", "Statistiques") en serif
  → l'app fait "moins pro", on perd la sensation de tableau de bord
  fonctionnel.
- Sous-sections multiples → l'œil se fatigue, la hiérarchie s'écrase.

#### Règle

**Police display = MARKETING UNIQUEMENT.** Hors marketing, on utilise
la police body en **bold (700)** ou **semibold (600)**. Le contraste
éditorial vient de la hiérarchie (taille + weight + ornements type
gold-bar prefix), pas du changement de famille.

Catégories typiques :

| Catégorie                          | Police                  |
| ---------------------------------- | ----------------------- |
| H1 hero landing page               | Display (regular 400)   |
| H2 sections marketing landing      | Display (regular 400)   |
| Nom / pseudo mis en avant éditorial | Display (regular 400)   |
| H1 pages légales (cgu, contact…)   | Display (regular 400)   |
| OG images dynamiques               | Display (regular 400)   |
| **Tout le reste**                  | **Body bold/semibold**  |

Le "tout le reste" inclut : titres de modales, titres internes
dashboard / admin / compte, pseudo dans le contexte privé (dashboard),
labels, sous-sections, stat-cards, banners utilitaires (cookie banner,
upsell, email-gate, etc.).

#### Cas borderline : composant partagé entre marketing et interne

Si un composant (ex: `SectionTitle`) est consommé à la fois par la
landing page **et** par le dashboard interne, ne pas mettre un prop
`variant: "marketing" | "internal"` (les call-sites oublieront de le
passer ou se trompent). **Split en deux composants distincts** :

```tsx
// components/ui/section-title.tsx

export function MarketingSectionTitle(props) {
  return <h2 className="font-display text-h2">...</h2>;
}

export function SectionTitle(props) {
  // Même pattern visuel (gold-bar prefix, optional CTA), MAIS font-body bold.
  return <h2 className="font-body text-h2 font-bold">...</h2>;
}
```

Le nom devient la source de vérité. Plus de risque d'oubli silencieux.

#### Chiffres et stats : `tabular-nums` obligatoire

Quand on affiche des nombres dans une grille de stat-cards (ex: 3 cards
"Total | Mois | Aujourd'hui") :

```tsx
<span className="font-body text-[48px] font-bold tabular-nums">
  {value}
</span>
```

`tabular-nums` force chaque chiffre à occuper la même largeur (figures
"old-style" → "lining" tabulaires). Sans cette propriété, "127" est
plus large que "117" parce que le "2" est plus large que le "1" en
proportional figures. Dans une grille de 3 cards, les valeurs ne sont
pas alignées entre elles, ce qui fait amateur.

#### Audit : grep le fautif

À chaque revue ou nouveau dev :

```bash
grep -rn "font-display" frontend/app frontend/components
```

Chaque occurrence doit appartenir à la liste KEEP marketing. Sinon,
migrer vers `font-body font-bold` (ou `font-semibold` pour les h5/h6).

**Pourquoi** : une police display est un outil de contraste. Utilisée
partout, elle devient bruit. Utilisée avec parcimonie sur le marketing
exclusivement, elle conserve son pouvoir d'évocation tout en laissant
l'UI interne respirer dans un système typographique cohérent et "pro".

---

### Pattern : modales destructives — le rouge se mérite

Une modale qui confirme une action destructive (suppression de compte,
annulation d'abonnement, purge de données, etc.) doit transmettre la
gravité de l'action **sans crier**. Le piège classique : encadrer
toute la modale d'un bord rouge alarmant + titre rouge + bordure dorée
sur le bouton de confirm = collision esthétique + sur-dramatisation.

#### Règle : "le rouge se mérite"

Le rouge destructive doit être réservé au **point focal de l'action**,
c'est-à-dire le bouton de confirmation **et rien d'autre** dans la
modale. Tout le reste (cadre, titre, description) utilise la palette
neutre standard du DS.

| Élément modale         | Avant (mauvais)         | Après (bon)              |
| ---------------------- | ----------------------- | ------------------------ |
| Cadre / bordure        | `border-destructive`    | `border-surface-elevated` (standard) |
| Titre "Supprimer ?"    | `text-destructive`      | `text-foreground` (bold) |
| Description            | Avec accents rouges     | `text-muted-foreground`, accents en `text-foreground` bold |
| Bouton "Annuler"       | OK secondary            | OK secondary (transparent + border subtil) |
| **Bouton "Supprimer"** | Border dorée + bg rouge | `bg-destructive` PLEIN + `text-white`, pas de bordure dorée |

Le rouge ainsi concentré sur l'action focalise l'attention sans
parasiter le reste de la composition. Les bordures dorées (primary
DS) **n'ont rien à faire** sur un bouton destructif — collision
esthétique chaud/chaud.

#### Pattern : confirmation par tape-email

Pour les actions vraiment irréversibles (suppression de compte,
factory reset), on demande à l'utilisateur de **taper son email
exact** plutôt que de cocher une case "je confirme". L'email est
pré-affiché dans la description (entre parenthèses, en `font-mono` ou
bold) et utilisé comme placeholder de l'input.

```tsx
// Validation : comparaison case-insensitive + trim
const emailMatches =
  typedEmail.trim().toLowerCase() === userEmail.toLowerCase();

// Bouton désactivé tant que la valeur ne match pas
<Button variant="destructive" disabled={!emailMatches || submitting}>
  Supprimer définitivement
</Button>
```

Avantages :

- **Friction proportionnée** à l'enjeu — l'utilisateur doit poser les
  doigts sur le clavier, pas juste cliquer.
- **Anti-double-click** naturel : l'input est forcément vide à
  l'ouverture → bouton désactivé d'office.
- **Cas test inattendu** : un utilisateur partage son écran et un
  collègue voit "votre@email.com" pré-affiché → il sait ce qu'il
  signe (vs un coche-case anonyme).

#### Harmonisation des tailles de boutons

Dans une modale, les boutons CTA (Annuler + Confirmer) doivent avoir
**la même hauteur**. Si on utilise un système CVA, ça se fait
naturellement quand les deux boutons ont la même `size`. Le piège :
prendre `size="lg"` pour l'action destructive "parce que c'est
important" et `size="sm"` ou `size="default"` pour Annuler → les deux
boutons sont mismatch en hauteur, le résultat est foireux.

Recommandation : un size `md` intermédiaire (≈44px de haut,
text-body-16, padding modéré) entre `sm` (compact inline) et `lg`
(CTA marketing). Utiliser `md` partout en contexte modale.

```tsx
size: {
  sm: "px-4 py-2 text-body-16",        // ≈36px - inline / actions secondaires
  md: "px-5 py-3 text-body-16",        // ≈44px - modales (sweet spot)
  default: "px-8 py-4 text-body-16",   // ≈52px - CTA standard
  lg: "px-8 py-4 text-h5",             // ≈55px - CTA marketing
}
```

#### Layout boutons : flex-1 stretch ou justify-end

Deux patterns valides pour aligner Annuler + Confirmer :

1. **flex-1 stretch** (chacun prend 50% de la largeur, mobile-friendly) :
   ```tsx
   <div className="flex flex-col gap-3 sm:flex-row">
     <Button className="flex-1">Annuler</Button>
     <Button className="flex-1" variant="destructive">Supprimer</Button>
   </div>
   ```
2. **justify-end** (boutons compacts alignés à droite, plus desktop-classique) :
   ```tsx
   <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
     <Button>Annuler</Button>
     <Button variant="destructive">Supprimer</Button>
   </div>
   ```

Choisir selon la largeur de la modale (max-w-[480px] → préférer
flex-1 stretch ; modale plus large → justify-end gagne en élégance).

**Pourquoi** : une modale destructive n'est pas une alarme incendie.
C'est un point de confirmation sérieux. La hiérarchie visuelle doit
guider l'utilisateur vers l'action (le rouge solid) tout en lui
laissant la respiration nécessaire pour réfléchir (cadre neutre,
titre lisible non-coloré).

---

### Anti-patterns : "AI-generated dashboard" — patterns à éviter

Quand un dashboard / page compte / settings produit une impression
"généré par IA" sans qu'on sache pourquoi, c'est presque toujours un
empilement des mêmes patterns. Les voici listés pour pouvoir les
détecter au moment du dev, pas après coup.

#### 1. Compteurs vanity sans contexte

**Symptôme** : 3 stat cards alignées en haut de page avec un gros
chiffre + un label muted ("12 / Abonnements actifs", "47 / Achats au
total", "8 / Sports suivis"). Ces chiffres ne servent à rien — ils
sont DÉJÀ visibles dans les sections qui suivent (la liste des abos
montre 12 cards, l'historique en montre 47, etc.).

```tsx
// ❌ AI-like : 3 stat cards isolées qui dupliquent l'info en-dessous
<div className="flex divide-x">
  <KpiStat label="Abos actifs" value={12} />
  <KpiStat label="Day-passes" value={47} />
  <KpiStat label="Sports suivis" value={8} />
</div>

// ✅ Humain : une ligne descriptive en prose, naturelle, qui s'efface
//    quand l'info est absente (item à 0 → masqué)
<p className="text-muted-foreground">
  12 abonnements actifs · 47 achats au total · 8 sports suivis
</p>
```

**Quand garder les stat cards** : dashboard analytique pur (admin, BI)
où la donnée n'est PAS répétée ailleurs et où la lecture rapide d'un
chiffre est l'usage principal. Pour une page "Mon compte" utilisateur,
les stats vanity sont du bruit.

#### 2. Parenthèses de comptage sur titres de section

**Symptôme** : "Abonnements actifs (3)", "Historique (47)". L'humain
écrit jamais comme ça. Le nombre est immédiatement visible dans la
liste qui suit.

```tsx
// ❌ AI-like
<h2>Abonnements actifs (3)</h2>

// ✅ Humain
<h2>Abonnements actifs</h2>
```

Si le compte est vraiment utile à exposer (ex: historique très long
avec pagination), mettre une mention discrète en sous-titre, pas
entre parenthèses du titre :

```tsx
<h2>Historique</h2>
<p className="text-muted-foreground">47 achats au total</p>
```

#### 3. Emojis / icônes décoratifs sans signification

**Symptôme** : "TennisAce ⚡" ou "RugbyPro 🔥" à côté d'un nom — l'éclair
ou la flamme n'a aucune signification métier, c'est juste pour "faire
joli". Résultat : du bruit visuel + l'utilisateur cherche un sens qui
n'existe pas.

**Règle** : un icône à côté d'un texte doit avoir une **signification
métier** vérifiable :

| Icône               | Signification valide                       |
| ------------------- | ------------------------------------------ |
| ⚡ Lightning éclair | "Expert featured / Recommandé"             |
| 🔥 Fire             | "Sur une série gagnante" (streak métier)   |
| ✓ Check             | "Statut vérifié / actif"                   |
| ⏱ Clock             | "En cours / temporaire"                    |
| (rien)              | Décoration sans sens → ne PAS l'afficher   |

Si on ne peut pas écrire un `title=` / tooltip qui explique le pourquoi
en une phrase, l'icône doit dégager.

#### 4. Prose narrative > listing chiffré

**Symptôme** : tendance à exprimer en chiffres "Inscrit depuis : 12
mois", "Niveau : 3/5", "Score : 87%". L'humain préfère la prose pour
les méta-données qui ne demandent pas d'action.

```tsx
// ❌ AI-like (chiffres avec labels redondants)
<dl>
  <dt>Inscrit depuis</dt><dd>12 mois</dd>
  <dt>Dernière connexion</dt><dd>2 jours</dd>
</dl>

// ✅ Humain
<p className="text-muted-foreground">
  Membre depuis janvier 2026 · Dernière visite il y a 2 jours
</p>
```

Les vraies "stat cards" doivent être réservées aux chiffres
**actionnables** (revenus à reverser, factures en attente, alertes à
traiter) — pas aux méta-données décoratives.

#### 5. Empty states avec illustration + emoji + 3 phrases

**Symptôme** :

```tsx
// ❌ AI-like
<div className="text-center">
  <span className="text-6xl">📭</span>
  <h3>Pas de message</h3>
  <p>Aucun message reçu pour le moment.</p>
  <p>Reviens plus tard !</p>
  <Button>Composer un message</Button>
</div>
```

Trois phrases pour dire la même chose + emoji + CTA générique. Faire
simple :

```tsx
// ✅ Humain
<div className="text-center">
  <p className="text-foreground">Aucun message</p>
  <p className="text-muted-foreground">Les nouveaux messages apparaîtront ici.</p>
  <Button>Composer</Button>
</div>
```

Une phrase de constat, une de contexte, une action si elle a du sens.

#### 6. Champs / boutons avec icône SYSTÉMATIQUE

**Symptôme** : un icône devant chaque label, chaque bouton, chaque
champ. La page ressemble à une planche de pictogrammes.

```tsx
// ❌ AI-like
<Button><Download /> Télécharger</Button>
<Button><Settings /> Paramètres</Button>
<Button><User /> Profil</Button>

// ✅ Humain
<Button>Télécharger</Button>
<Button>Paramètres</Button>
<Button>Profil</Button>
```

Les icônes ont leur place sur les **actions où le geste est plus
expressif que le mot** (corbeille pour supprimer, croix pour fermer,
crayon pour éditer). Pour le reste, le texte seul suffit.

#### Checklist de fin de feature

Avant de marquer une page comme "done", passer cette checklist :

- [ ] Aucun stat card vanity en dupliqué de ce que la liste affiche déjà ?
- [ ] Pas de "(N)" entre parenthèses dans les titres de section ?
- [ ] Tous les icônes décoratifs ont une signification métier vérifiable
      (sinon → retirer) ?
- [ ] Les méta-données passives sont en prose, pas en `dl/dt/dd` ?
- [ ] Les empty states font 2 phrases max ?
- [ ] Les boutons CTA n'ont des icônes que si le geste est explicite
      (download, delete, edit, close) ?

Si la page coche ces 6 cases, elle est déjà nettement moins "AI-like"
que la moyenne.

---

## 8. À compléter au fil des audits

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
