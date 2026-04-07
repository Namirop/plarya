# PROJET : Site de Pronos Sportifs

## 1. CONTEXTE & OBJECTIF

**Business model :**

- Tipsters publient pronos payants (day pass 3€ ou abo mensuel 19€)
- Users paient pour voir les pronos
- Affiliation bookmakers (CPA)
- Tipsters paient 39€/trimestre pour être listés

**Objectif UX :** Pousser au clic, teasing, conversion rapide (mobile-first)

---

## 2. STACK TECHNIQUE

### Frontend

- Next.js 15 (App Router, **PAS** Pages Router)
- TypeScript strict
- Tailwind CSS
- shadcn/ui pour composants de base

### Backend (séparé)

- Node.js + Express
- Prisma ORM + PostgreSQL
- JWT auth (access + refresh tokens)

### Paiement

- Stripe Checkout (Apple Pay + Google Pay activés)
- Webhooks pour abonnements

### Email

- Resend pour emails transactionnels

---

## 3. DESIGN SYSTEM

### Palette Couleurs

```
Noir:           #000000
Blanc:          #FFFFFF
Gris foncé:     #18181B
Gris moyen:     #71717A
Accent vert:    #00FF41
Or badges:      #FFD700
```

### Typography

- Police: **Inter** (pas de polices fancy)
- Tailles: `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`
- Pas de polices custom

### Style Visuel

- Minimaliste, sobre, pro
- Inspiré de Betclic/Winamax (paris sportifs)
- **PAS** de gradients
- **PAS** de glassmorphism
- **PAS** d'animations spring excessives
- Bordures fines (`border-gray-800`)
- Ombres légères (`shadow-sm`, `shadow-md`)
- Beaucoup d'espace blanc (spacing généreux)

### Mobile-First

- Toutes les pages responsive
- Cards scrollables sur mobile
- Boutons CTA gros et visibles

### IMPORTANT

**Toutes les couleurs doivent passer par les variables Tailwind définies dans `tailwind.config.js`, jamais de couleurs hardcodées dans les composants.**

---

## 4. ARCHITECTURE FRONTEND

```
/app
  /page.tsx                    # Homepage (6 cards tipsters top)
  /(auth)
    /login/page.tsx
    /register/page.tsx
  /tipsters
    /[id]/page.tsx             # Profil tipster
  /classement
    /page.tsx                  # Tableau classement général
  /devenir-tipster
    /page.tsx                  # Page candidature tipster
  /dashboard
    /page.tsx                  # Dashboard tipster
  /mes-abonnements
    /page.tsx                  # Gestion abos user
  /admin
    /page.tsx                  # Panel admin

/components
  /ui                          # shadcn/ui components
  /tipsters
    /tipster-card.tsx          # Card homepage
    /tipster-profile.tsx
  /pronos
    /prono-card.tsx
    /prono-detail.tsx

/lib
  /api.ts                      # Calls backend API
  /stripe.ts

/hooks
  /use-user.ts
  /use-tipsters.ts
```

---

## 5. FONCTIONNALITÉS DÉTAILLÉES

### PAGE D'ACCUEIL

Afficher **6 tipsters max** (top du jour)

#### Card Tipster (format exact)

```
┌─────────────────────────────┐
│ 🔥 [Photo] Pseudo           │  ← Badge + photo + pseudo
│ 85% (10 derniers)           │  ← Taux réussite
│                             │
│ ⚽ Ligue 1 / 🎾 Tennis      │  ← Bio sports
│ 🎯 3 pronos aujourd'hui     │  ← Nombre pronos
│                             │
│ [Matchs affichés floutés]   │  ← Pronos cachés 🔒
│                             │
│ 💣 Value aujourd'hui        │  ← Teasing
│ 💰 Cote @7.2                │  ← Cote totale
│                             │
│ [Débloquer (3€)]            │  ← CTA bien visible
└─────────────────────────────┘
```

#### Teasing (dropdown prédéfini)

- 🎯 Pick solide
- 💣 Value
- 🔒 Safe
- 📈 Opportunité
- 🚨 Pick du jour
- 👀 À ne pas rater

#### Badge Streak

- 🔥 = 3 pronos consécutifs gagnés
- 🔥🔥 = 5 pronos consécutifs
- 🔥🔥🔥 = 10 pronos consécutifs

---

### PROFIL TIPSTER

#### Header

- Photo profil (grande)
- Pseudo + badge streak
- Taux réussite (10 derniers pronos)
- Bio visible (sports + nombre pronos aujourd'hui)

#### Corps

- Liste pronos **FLOUTÉS** (effet blur ou cadenas 🔒)
- Cote totale visible
- Bouton "Débloquer (3€)" **sticky** (toujours visible sans scroller)

---

### DASHBOARD TIPSTER

#### Features

- Publier prono (formulaire : match, pick, cote, dropdown teasing)
- Liste ses pronos publiés
- Valider prono (bouton gagné/perdu)
- Voir stats (taux 10 derniers, total pronos, revenus estimés)
- Gérer profil (bio, sports, photo)
- Voir ses abonnés actuels

---

### PAGE CLASSEMENT GÉNÉRAL

#### Tableau Responsive

```
┌──────┬────────┬──────────┬────────┬────────┬──────────┬─────────┐
│ Rang │ Photo  │ Pseudo   │ Badge  │ Taux   │ Prix     │ Action  │
├──────┼────────┼──────────┼────────┼────────┼──────────┼─────────┤
│ #1   │ [img]  │ TipPro   │ 🔥🔥   │ 92%    │ 3€ / 19€ │ [Voir]  │
│ #2   │ [img]  │ BetKing  │ 🔥     │ 88%    │ 3€ / 19€ │ [Voir]  │
└──────┴────────┴──────────┴────────┴────────┴──────────┴─────────┘
```

**Mobile :** Cards scrollables horizontalement

---

### PAGE PRONO (après paiement)

#### Structure

1. **Prono dévoilé** (match, pick, cote, argumentaire)

2. **Comparateur bookmakers**

   ```
   ┌──────────────────────────────────┐
   │ Winamax  @1.85  [Parier +100€]   │
   │ Betclic  @1.82  [Parier +100€]   │
   │ PMU      @1.80  [Parier +100€]   │
   └──────────────────────────────────┘
   ```

   - Tipster entre sa cote lors publication
   - Afficher pour 3 bookmakers (Winamax, Betclic, PMU)
   - Liens affiliation hardcodés (fournis par client)
   - Format : Logo bookmaker + Cote + Bouton "Parier +100€"

3. **Gros CTA :** "Parier ce prono maintenant"

**Objectif :** Tout doit pousser vers affiliation bookmakers

---

### PAGE "DEVENIR TIPSTER"

#### Formulaire

- Pseudo
- Email
- Bio (textarea)
- Sports couverts (checkboxes)

**Paiement :** Stripe 39€/trimestre

**Après validation :** Compte tipster créé

---

### PANEL ADMIN (`/admin`)

#### Features

- Créer compte tipster (statut gratuit ou payant 39€/trim)
- Liste tipsters (pseudo, statut abo, taux, actions)
- Liste users (email, abos actifs)
- Override résultat prono (changer gagné ↔ perdu)
- Ajouter avertissement sur profil tipster (textarea)
- Stats globales (nb users, nb tipsters, revenus totaux)
- Envoyer email J+1 manuellement (bouton)

---

### UPSELL POST-ACHAT

Modal après paiement day pass :

```
✅ Prono débloqué !

Envie de voir d'autres tipsters ?
[Voir un autre tipster]

Ou passe en abonnement mensuel (19€)
[S'abonner]
```

---

### EMAIL AUTOMATIQUE J+1

**Sujet :** "Le prono d'hier est passé ! ✅"

**Corps :**

```
Salut {user},

Le prono de {tipster} d'hier a gagné ! 🎯

Regarde ses pronos d'aujourd'hui :
[Voir les pronos]

Ou découvre d'autres tipsters :
[Voir le classement]
```

**+ CTA bookmaker**

**Envoi :**

- Cron job auto quotidien à 10h
- Check pronos validés hier
- Envoie email via Resend aux users qui ont acheté ce prono

---

## 6. LOGIQUE MÉTIER CRITIQUE

### TAUX DE RÉUSSITE (10 derniers pronos uniquement)

```sql
SELECT
  COUNT(CASE WHEN result = 'won' THEN 1 END) * 100.0 / 10 as win_rate
FROM (
  SELECT result FROM pronos
  WHERE tipster_id = ?
  ORDER BY created_at DESC
  LIMIT 10
) recent
```

**À chaque nouveau prono validé :**

- Supprimer le plus ancien (si > 10)
- Ajouter le nouveau
- Recalculer taux

**Historique complet stocké en DB mais pas affiché**

---

### BADGES STREAK

**Calcul :**

1. Fetch derniers pronos du tipster (ordre chrono DESC)
2. Count consécutifs gagnés depuis le dernier perdu
3. Si >= 3 → 🔥
4. Si >= 5 → 🔥🔥
5. Si >= 10 → 🔥🔥🔥

---

### VALIDATION PRONOS

- Tipster marque "gagné" ou "perdu"
- Admin peut override (bouton "Modifier résultat")
- Admin peut ajouter avertissement sur profil

**V2 future :** API pour validation auto

---

## 7. SÉCURITÉ & PERFORMANCE

- CORS configuré (frontend Vercel → backend Railway)
- Rate limiting (express-rate-limit)
- Validation Zod sur toutes les routes
- JWT avec refresh tokens
- Stripe webhooks sécurisés (signature verification)
- Images optimisées (next/image)
- Lazy loading components

---

## 8. NOTES IMPORTANTES

- **Toujours mobile-first**
- **CTA toujours visibles (sticky si besoin)**
- **Effet de teasing partout (pronos floutés avant paiement)**
- **Conversion prioritaire sur tout le reste**
- **Design sobre, pas d'effet IA-vibe**
