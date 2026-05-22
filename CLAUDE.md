# PROJET : Plarya — Plateforme d'analyses sportives

## 1. CONTEXTE & OBJECTIF

Plarya est une plateforme qui met en avant des analystes sportifs experts. Les utilisateurs paient pour accéder à leurs analyses sportives.

**Positionnement :** Plateforme d'analyses sportives premium. PAS un site de paris. Le vocabulaire et le design doivent refléter cette positioning "expertise et conseil", pas "betting".

**Business model :**

- Experts publient des analyses payantes
- Accès unitaire : 3,5€ par analyse (day pass)
- Abonnement mensuel : 29€
- Commission plateforme : 30% — Expert : 70% (reversement par virement manuel mensuel par l'admin, pas Stripe Connect pour le MVP)
- Affiliation bookmakers (CPA) sur les pages d'analyses débloquées
- Accès expert sur invitation/validation admin uniquement (pas d'inscription publique pour devenir expert)

**Objectif UX :** Conversion rapide, friction minimale, mobile-first, achat sans création de compte préalable.

---

## 1.1 VOCABULAIRE — RÈGLE STRICTE

**Mots INTERDITS sur toutes les pages publiques, boutons, emails, et UI visible :**

- prono, pronostic, pronostics
- pari, parier, parieur, paris
- betting, bet, bets
- "gagner de l'argent"

**Mots à utiliser à la place :**

- analyse, analyses
- sélection, sélections
- prédiction, prédictions
- avis sportif
- expert, analyste, spécialiste
- "accéder", "débloquer" (pour les CTAs)

Le code interne (noms de variables, tables Prisma, types TypeScript) peut garder "prono" pour éviter une refonte massive de la DB. Mais TOUT texte affiché à l'utilisateur final doit utiliser le nouveau vocabulaire.

Exemples :

- ❌ "Publier un prono" → ✅ "Publier une analyse"
- ❌ "Débloquer le prono" → ✅ "Accéder à l'analyse"
- ❌ "Meilleurs pronostiqueurs" → ✅ "Nos experts"

---

## 2. STACK TECHNIQUE

### Frontend

- Next.js 15 (App Router, PAS Pages Router)
- TypeScript strict
- Tailwind CSS
- shadcn/ui pour composants de base

### Backend (séparé)

- Node.js + Express
- Prisma ORM + PostgreSQL
- Auth par magic link (PAS de password, PAS de JWT refresh classique)

### Paiement

- Stripe Checkout (Apple Pay + Google Pay activés)
- Webhooks pour abonnements
- Flow sans compte préalable (email only)

### Email

- Resend pour emails transactionnels et magic links

---

## 3. DESIGN SYSTEM — PLARYA

### Direction artistique

Dark mode premium avec accents dorés. Inspiration : plateformes de trading haut de gamme, sites d'analyses financières/sportives premium. L'esthétique doit transmettre expertise, confiance, exclusivité.

**PAS** de design minimaliste blanc type SaaS. **PAS** d'apparence "app générique".

Fond principal (noir profond) : #0A0A0A
Fond cards (noir nuancé) : #141414
Fond cards hover : #1A1A1A
Bordures subtiles : #1F1F1F
Bordures dorées subtiles : rgba(212, 175, 55, 0.2)
Bordures dorées actives : rgba(212, 175, 55, 0.5)
Texte principal : #FFFFFF
Texte secondaire : #A1A1AA
Texte tertiaire : #71717A
Or principal : #D4AF37
Or clair (highlights) : #F4D03F
Or sombre (bordures) : #8B7500
Vert succès : #10B981
Rouge erreur : #EF4444

### Typography

- Police corps : **Inter** (400, 500, 600, 700)
- Titres principaux : Inter 700/800 avec `tracking-wide` ou `tracking-wider`, souvent en MAJUSCULES pour les sections importantes
- Titres avec gradient doré : `bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent`

### Effets visuels (autorisés et encouragés)

- **Gradients dorés** sur les titres importants
- **Glow doré** autour des cards et boutons CTA : `shadow-[0_0_40px_rgba(212,175,55,0.2)]` au repos, `shadow-[0_0_60px_rgba(212,175,55,0.35)]` au hover
- **Bordures dorées subtiles** sur les cards : `border border-amber-500/20`
- **Texture de grain/noise** : appliquer un noise SVG inline ou data URI en overlay global sur `body`, avec `mix-blend-mode: overlay` et opacity ~0.08. Pas de fichier PNG externe.
- **Radial gradients** pour créer des effets de lumière ambiante en arrière-plan des sections (lueur dorée qui émane du centre ou du bas de la section)
- **Transitions douces** sur hover : `transition-all duration-300 ease-out`
- Animations subtiles sur les cards (léger scale ou translateY au hover)

### Composants clés

**Cards expert (homepage et profil) :**

- Fond noir nuancé (#141414)
- Bordure dorée subtile (rgba(212,175,55,0.2))
- Glow doré au hover
- Photo de l'expert dans un cercle bordé d'or
- Badge "EXPERT" en doré avec bordure

**Boutons CTA principaux ("Accéder (3,5€)") :**

- Fond transparent avec bordure dorée + gradient doré subtil en arrière-plan
- Glow doré
- Texte blanc ou doré selon le contraste
- Coins légèrement arrondis (rounded-lg)
- Hover : glow plus intense, légère translation

**Titres de section :**

- Gradient doré
- Majuscules, `tracking-wider`
- Centrés, avec parfois des lignes décoratives dorées de part et d'autre

**Logo :**

- Placé dans `/frontend/public/logo.png` (fourni par le client, uniquement le symbole P avec la flèche)
- Le texte "PLARYA" à droite du logo est recréé en CSS avec une typo dorée (gradient from-amber-200 to-amber-500, tracking-widest)
- Slogan en dessous "ANALYZE · DECIDE · IMPROVE" en plus petit, doré clair, letter-spacing large

### Règles strictes

- **JAMAIS** de fond blanc sur les pages publiques (ni dashboard expert, ni admin — tout en dark)
- **JAMAIS** de couleurs vives genre vert électrique, bleu saturé, rose
- **TOUJOURS** passer par des variables Tailwind centralisées (définies dans `globals.css` via `@theme` pour Tailwind v4)
- **Mobile-first** reste la règle, mais sans sacrifier l'esthétique premium sur desktop

### Assets (placeholders acceptés)

- **Logo** : fourni, dans `/frontend/public/logo.png`
- **Photos d'experts** : placeholders pour l'instant — cercle avec initiale en doré sur fond noir nuancé. Seront remplacées par de vraies photos plus tard.
- **Images de fond des sections domaine (Sport/Esport/Hippique)** : placeholders pour l'instant — gradient doré sombre avec icône emoji centrale et texte. Seront remplacées par de vraies images plus tard.

---

## 4. ARCHITECTURE FRONTEND

```
/app
  /page.tsx
  /experts
    /[id]/page.tsx
  /devenir-expert
    /page.tsx
  /dashboard
    /page.tsx
  /mon-compte
    /page.tsx
  /admin
    /page.tsx
  /auth
    /verify/page.tsx

/components
  /ui
  /experts
    /expert-card.tsx
    /expert-profile-header.tsx
  /analyses
    /analysis-card.tsx
    /analysis-detail.tsx
  /layout
    /navbar.tsx
    /footer.tsx
    /noise-overlay.tsx

/lib
  /api.ts
  /stripe.ts
  /magic-link.ts

/hooks
  /use-user.ts
  /use-experts.ts
```

**Pages supprimées par rapport à la v1 :**

- `/classement` (retirée — pas de classement)
- `/login` et `/register` classiques (remplacés par magic link dans modal inline)

---

## 5. FONCTIONNALITÉS DÉTAILLÉES

### PAGE D'ACCUEIL

#### Structure

1. **Hero / Header**
   - Logo Plarya + texte "PLARYA" doré + slogan
   - Navbar avec "Se connecter" (ouvre modal email magic link)

2. **Section "Explore les domaines"** (inspirée de la référence)
   - 3 cards : SPORT, ESPORT, HIPPIQUE
   - SPORT et ESPORT : cliquables → filtrent les experts affichés en dessous
   - HIPPIQUE : "Arrive bientôt..." (disabled)
   - Chaque card : image de fond (placeholder gradient doré pour l'instant), titre en doré, bouton "Voir les analyses"

3. **Section "Nos experts"**
   - Titre "NOS EXPERTS" en doré
   - **Slide horizontale** avec les experts (swipe sur mobile, flèches sur desktop)
   - **Ordre :** par date d'arrivée (nouveaux en premier) avec possibilité de réordonner manuellement via admin
   - **PAS de classement, PAS de tri par performance, PAS d'affichage du taux de réussite**
   - Max 10 experts affichés par défaut

4. **Section "Pourquoi Plarya ?"** (réassurance, bas de homepage)
   - 3 piliers dans une card encadrée (`bg-black/40`, radius 16) :
     - ⏱ **Gain de temps** — "Accédez directement aux analyses. Pas de recherche, pas de bruit."
     - ⚡ **Simple** — "Tout est prêt. Choisissez un expert, accédez à ses sélections."
     - 💳 **Sans engagements** — "Paiement à l'acte. 3,50€ le jour, sans abonnement obligatoire."

5. **Footer**
   - Liens : Confidentialité, Mentions légales, CGU, Contact
   - Copyright

#### Card Expert (nouveau format)

```
┌─────────────────────────────────┐
│ [Photo] Pseudo                  │
│         EXPERT                  │
│                                 │
│ Consulté 127 fois aujourd'hui   │
│                                 │
│ ⚽ Ligue 1 🇫🇷  🎾 ATP           │
│                                 │
│ Analyses du jour :              │
│ • Real Madrid - Barcelone       │
│ • Lens vs Rennes                │
│ • AS Monaco vs Nantes           │
│                                 │
│ ⭐ Analyse du jour              │
│                                 │
│ [Accéder (3,5€)]                │
└─────────────────────────────────┘
```

---

**Important :**

- **La ExpertCard de la homepage est une vitrine** : tous les noms des matchs sont affichés en clair, sans cadenas ni blur ni contenu masqué. La seule variation entre les deux états (Unlocked / Locked) porte sur le bouton du bas (variant `white` : actif "Accéder (3,50€)" ou disabled "Terminé pour aujourd'hui").
- Le teasing du pick (prédiction spécifique) vit sur le **profil expert** (`/experts/[id]`), **pas sur cette card de homepage**. Voir §"PROFIL EXPERT" plus bas pour le masquage du pick.
- **PAS de badge streak, PAS de taux de réussite affiché**
- L'utilisateur doit immédiatement comprendre les sports couverts et les matchs du jour

---

### PROFIL EXPERT (`/experts/[id]`)

#### Header

- Grande photo de profil en cercle doré avec glow
- Pseudo en gros, doré avec gradient
- Badge "EXPERT" en dessous
- Compteur "X vues aujourd'hui" (preuve sociale)
- Bio courte
- Sports couverts avec icônes + drapeaux/ligues

**PAS de badge streak, PAS de taux de réussite, PAS de "profit total"** (dans la référence on voit +3200€ et un badge profit, on ne met PAS ça — c'est trop "betting")

#### Corps — Liste des analyses du jour

Format pour chaque analyse (avant paiement) :

- Icône sport / ligue
- Match visible (ex: "Real Madrid vs Murcia")
- Catégorie visible (ex: "BASKET EURO", "LIGUE 1")
- Type d'analyse visible (ex: "176,5 Points", "But des 2 équipes")
- Cote visible
- **Pick caché** (juste un cadenas ou blur sur la prédiction spécifique)
- Heure de début du match

#### Système d'horaires

- Chaque analyse a une heure de début obligatoire (`startTime`)
- Si l'heure actuelle >= startTime : le bouton "Accéder" est désactivé pour cette analyse, avec mention "Analyse terminée"
- Si toutes les analyses du jour sont terminées : le CTA sticky global devient "Toutes les analyses du jour sont terminées, reviens demain"

#### CTA sticky (bas de page, mobile et desktop)

- "Débloquer les X analyses (3,5€)"
- Ou "S'abonner (29€/mois)"
- Doré avec glow

---

### DASHBOARD EXPERT (`/dashboard`)

Dark mode, stylé comme le reste du site.

#### Features

- Publier une analyse (formulaire) :
  - Match
  - Ligue
  - Sport (dropdown avec icônes)
  - Pick
  - Cote
  - Teasing (dropdown prédéfini)
  - Argumentaire
  - **Heure de début du match** (obligatoire)
  - Cotes bookmakers (3 inputs optionnels)
  - Checkbox "Marquer comme analyse du jour" (pour la mettre en avant sur la card homepage)
- Liste des analyses publiées (avec filtres)
- Valider analyse (bouton gagné/perdu)
- Voir stats internes (taux 10 derniers, total, revenus estimés — réservé à l'expert, PAS affiché en public)
- Gérer profil (bio, sports, photo)
- Voir ses abonnés actuels
- Voir ses ventes (liste des users qui ont acheté, dates, montants)

---

### FLOW DE PAIEMENT (sans compte préalable, magic link)

C'est le changement le plus important. **Pas de création de compte avant le paiement.**

#### Parcours utilisateur

1. L'utilisateur arrive sur le profil d'un expert et voit les analyses floutées
2. Il clique sur "Accéder (3,5€)"
3. **Modal s'ouvre** :
   - Titre : "Accédez à l'analyse"
   - Un seul champ : **email**
   - Texte : "Entrez votre email pour recevoir l'accès et votre facture"
   - Bouton : "Continuer vers le paiement"
4. L'utilisateur entre son email et clique → redirection vers Stripe Checkout (Apple Pay / Google Pay / CB)
5. Après paiement validé (webhook Stripe) :
   - Backend crée un compte user avec cet email (si n'existe pas déjà)
   - Backend crée la Subscription
   - Backend génère un magic link et l'envoie par email via Resend
   - Backend stocke un cookie de session pour connecter l'user immédiatement au retour Stripe
   - Stripe redirige vers `/experts/[id]?checkout=success`
   - La page détecte le cookie, l'user est connecté, les analyses sont débloquées
6. L'utilisateur voit son analyse immédiatement, sans aucune action supplémentaire
7. Il reçoit aussi un email avec le magic link pour revenir plus tard

#### Connexions suivantes

- L'user clique "Se connecter" dans la navbar
- Modal s'ouvre avec un champ email + bouton "Recevoir mon lien de connexion"
- Il entre son email, clique
- Email envoyé avec un magic link valide 15 min, usage unique
- Il clique sur le lien → connecté automatiquement → redirigé vers `/mon-compte`
- Session valide 30 jours

#### Implémentation backend

- Suppression du champ `password` et `passwordHash` sur User
- Nouvelle table Prisma `MagicLink` :
  - `id`, `token` (aléatoire cryptographique), `email`, `userId`, `expiresAt`, `usedAt`, `createdAt`
- Route `POST /auth/request-magic-link` : prend un email, génère un token, enregistre en DB, envoie l'email
- Route `GET /auth/verify?token=xxx` : valide le token (non expiré, non utilisé), marque `usedAt`, log l'user (cookie session), redirige
- Les anciennes routes `/auth/register` et `/auth/login` sont supprimées

---

### PAGE "MON COMPTE" (`/mon-compte`)

- Liste des abonnements actifs avec lien vers le profil de l'expert
- Historique des achats (dates, montants, experts, analyses)
- Bouton "Se déconnecter"
- Pas de modification de profil (pas de mdp à changer, l'email est fixe)

---

### PAGE "DEVENIR EXPERT" (`/devenir-expert`)

Devenir expert se fait via paiement Stripe d'un abonnement récurrent.

- Formulaire avec :
  - Pseudo (unique)
  - Bio
  - Sports couverts
- L'utilisateur doit être connecté (sinon redirection home).
- Soumission → création d'une session Stripe Checkout en mode `subscription` (39€/trimestre, intervalle 3 mois récurrent).
- Après paiement réussi (webhook Stripe `checkout.session.completed` avec `purpose=become_expert`) : création du record Expert + passage du rôle User à EXPERT en transaction Prisma + `subExpiresAt = now + 90 jours`. Le handler accepte aussi `purpose=become_tipster` pour les sessions Stripe pending pré-rename (backward-compat).
- L'utilisateur devient expert **immédiatement** après le paiement réussi (retour sur `/devenir-expert?checkout=success`).
- Renouvellement automatique trimestriel via webhook `invoice.paid` (extension `subExpiresAt` de +90j). Annulation Stripe → `subStatus = EXPIRED` via webhook `customer.subscription.deleted`.

⚠️ Restera à arbitrer plus tard : remettre un système de candidature manuelle gratuite (originellement prévu MVP), ou conserver ce paiement comme barrière qualité. Pour l'instant, le code et le brief sont alignés sur le paiement.

---

### PANEL ADMIN (`/admin`)

Dark mode, stylé.

#### Stats (en haut, cards dorées)

- **Chiffre d'affaires par jour** (graphique ou liste des 30 derniers jours)
- **Ventes par jour** : liste détaillée avec date, email acheteur, nom si disponible, montant, expert concerné
- **Nombre d'achats par expert** (classement interne, à usage admin uniquement)
- **Revenus générés par expert** (pour calculer les 70% à reverser manuellement)
- Stats globales : nb users, nb experts, nb abonnements actifs, CA total

#### Gestion experts

- Liste des experts avec pseudo, email, statut, date d'inscription
- Créer/inviter un nouvel expert (envoie un magic link d'activation)
- **Réordonner l'ordre d'affichage des experts sur la homepage** (drag & drop ou champ `displayOrder` avec input numérique)
- Override résultat analyse (changer gagné ↔ perdu)
- Ajouter avertissement sur profil expert
- Voir les candidatures reçues via `/devenir-expert`

#### Gestion users

- Liste des users avec email, date d'inscription, nb d'abonnements actifs

#### Gestion analyses

- Liste de toutes les analyses avec filtres (expert, sport, statut, date)
- Override résultats

#### Actions

- Bouton "Envoyer emails J+1 maintenant"
- Export CSV des ventes du mois (pour faciliter le reversement manuel)

---

### UPSELL POST-ACHAT (modal après checkout)

Modal après paiement day pass :

```
✅ Accès débloqué !

Envie de découvrir d'autres experts ?
[Voir tous les experts]

Ou passe en abonnement mensuel (29€)
[S'abonner]
```

---

### EMAIL AUTOMATIQUE J+1

**Sujet :** "L'analyse d'hier est passée ! ✅"

**Corps :**

```
Salut,

L'analyse de {expert} d'hier est passée 🎯

Découvrez ses analyses d'aujourd'hui :
[Voir ses analyses]

Ou découvrez d'autres experts :
[Voir tous les experts]
```

**Envoi :**
Envoi : cron quotidien à 10h, check les analyses WON de la veille, envoie aux users qui ont acheté ce jour-là ou qui ont un abonnement actif.

---

## 6. LOGIQUE MÉTIER

### Taux de réussite (interne uniquement, PAS affiché en public)

Calcul sur les 10 dernières analyses validées, pour usage interne (dashboard expert, admin). **Ne JAMAIS afficher ce chiffre sur les pages publiques (homepage, profil expert).**

### Suppression du système de streak/badges

Les badges 🔥 🔥🔥 🔥🔥🔥 sont **supprimés**. Pas de compétition entre experts.

### Compteur de vues (preuve sociale)

Chaque profil expert a un champ `viewsToday` incrémenté à chaque visite de son profil. Reset à minuit par un cron. Affiché en public : "Consulté X fois aujourd'hui".

### Analyse du jour mise en avant

Chaque expert peut flagger UNE analyse par jour comme "analyse du jour" via un champ `isFeatured` sur le modèle Prono (reset à minuit). Cette analyse est mise en avant sur sa card homepage.

### Système d'horaires

Chaque analyse (Prono) a un champ `startTime: DateTime` obligatoire. Le frontend vérifie côté client ET côté backend que `startTime > now()` avant d'autoriser l'achat. Si passé, le CTA est désactivé.

### Ordre d'affichage des experts

- Champ `displayOrder: Int` sur Expert
- Tri homepage : `ORDER BY displayOrder ASC, createdAt DESC`
- Admin peut modifier `displayOrder` pour réordonner manuellement
- Par défaut : les nouveaux experts ont le `displayOrder` le plus bas (apparaissent en premier)

### Validation analyses

- Expert marque gagné/perdu
- Admin peut override
- Admin peut ajouter avertissement sur profil

---

## 7. SÉCURITÉ & PERFORMANCE

- CORS configuré
- Rate limiting (express-rate-limit) sur routes auth (magic link request)
- Validation Zod sur toutes les routes
- Magic link tokens cryptographiquement sécurisés (crypto.randomBytes)
- Magic link expiration : 15 min, usage unique
- Session cookie httpOnly, secure, SameSite=Lax, 30 jours
- Stripe webhooks sécurisés (signature verification)
- Images optimisées (next/image)
- Lazy loading composants

---

## 8. NOTES IMPORTANTES

- **Toujours mobile-first**
- **CTA toujours visibles (sticky si besoin)**
- **Effet de teasing partout (picks cachés avant paiement, MAIS les matchs restent visibles)**
- **Conversion prioritaire sur tout le reste**
- **Design dark premium doré — JAMAIS de fond blanc sur pages publiques**
- **Vocabulaire : plateforme d'analyses sportives, PAS un site de paris**
- **Pas de classement, pas de compétition entre experts**

---

## 9. DESIGN SYSTEM — STATE

- Tokens DS dans `app/globals.css` sous `@theme` (Tailwind v4).
- La migration vers la DA golden-da est **terminée** : le bloc LEGACY V1 a été supprimé. Seuls subsistent dans `globals.css` les tokens DS golden-da + le mapping shadcn/ui (`--color-border`, `--color-destructive`, etc.) qui alimente les utilities Tailwind transverses.

## 10. TOKENS PRINCIPAUX

- `bg-background` : noir #000
- `text-foreground` : blanc
- `accent` / `bg-accent` : doré #dfb968
- `accent-strong` : doré profond #e1aa36
- `font-display` : DM Serif Display (titres H1/H2)
- `font-body` / `font-sans` : Work Sans (texte courant)
- `rounded` ou `rounded-2xl` : 16px (par défaut)
- `shadow-shine` : glow CTA principaux
- `shadow-shine-soft` : glow cards domaines

## 11. SPECS DE DESIGN

- DS complet : `design-system.md`
