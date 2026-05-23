/**
 * Types partagés entre les sections admin (extraits de l'ancien
 * `app/admin/page.tsx` monolithique). Centralisés ici pour qu'AdminClient,
 * page.tsx (server) et chaque _components/*Section.tsx puissent typer
 * leur initialData et leurs props sans dupliquer les interfaces.
 */

export interface Stats {
  usersCount: number;
  expertsCount: number;
  pronosCount: number;
  activeSubscriptionsCount: number;
  estimatedRevenueCents: number;
}

export interface RevenueDay {
  date: string;
  revenue: number;
  salesCount: number;
}

export interface Sale {
  id: string;
  date: string;
  email: string;
  expertPseudo: string;
  type: "DAY_PASS" | "MONTHLY";
  amount: number;
}

export interface ExpertRevenue {
  expertId: string;
  pseudo: string;
  salesCount: number;
  totalRevenue: number;
  expertShare: number;
}

export interface AdminExpert {
  id: string;
  pseudo: string;
  sports: string[];
  subStatus: string;
  displayOrder: number;
  warningMessage: string | null;
  createdAt: string;
  user: { email: string };
  _count: { pronos: number; subscriptions: number };
}

export interface AdminProno {
  id: string;
  matchName: string;
  league: string | null;
  odds: number;
  teasing: string;
  result: "PENDING" | "WON" | "LOST";
  createdAt: string;
  expert: { pseudo: string };
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { subscriptions: number };
}

export interface PronosPage {
  items: AdminProno[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface SalesPage {
  sales: Sale[];
  total: number;
}

/** Shape complète des données initiales injectées par page.tsx (server)
 *  dans <AdminClient>. Permet de lire les valeurs initiales partout
 *  sans avoir à fetch côté client au mount. */
export interface AdminInitialData {
  stats: Stats;
  revenueDays: RevenueDay[];
  sales: Sale[];
  salesTotal: number;
  expertRevenue: ExpertRevenue[];
  experts: AdminExpert[];
  pronos: PronosPage;
  users: AdminUser[];
}
