// Types des réponses /admin, partagés par page.tsx, AdminClient et les sections.

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

/** Données chargées côté serveur par page.tsx et transmises à AdminClient. */
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
