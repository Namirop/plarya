import type { Metadata } from "next";
import { Work_Sans, DM_Serif_Display } from "next/font/google";
import { HeaderAuth } from "@/components/layout/header-auth";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { UserProvider } from "@/hooks/use-user";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["400", "500", "600", "700"],
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-dm-serif",
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Analyses sportives par des experts`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "analyses sportives",
    "experts sport",
    "football",
    "tennis",
    "esport",
    "basketball",
    "rugby",
    "mma",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Analyses sportives par des experts`,
    description: SITE_DESCRIPTION,
    // L'OG image est auto-résolue par Next via app/opengraph-image.tsx
    // (ou app/opengraph-image.{png,jpg}). Cf. récap Phase 1 SEO pour
    // l'état de cette ressource.
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Analyses sportives par des experts`,
    description: SITE_DESCRIPTION,
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

// JSON-LD Organization : carte d'identité Plarya pour les rich
// results Google (Knowledge Graph candidate, brand panel, etc.).
const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/full-logo-remove.png`,
  description: SITE_DESCRIPTION,
};

// JSON-LD WebSite : marque le site comme entité, permet à Google
// d'afficher le nom propre dans les SERP (au lieu du domaine brut).
// Pas de SearchAction : /experts?q= n'existe pas en V1.
const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "fr-FR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${workSans.variable} ${dmSerif.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        {/* JSON-LD site-wide. dangerouslySetInnerHTML OK :
            le payload est 100 % contrôlé serveur, pas d'input user. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
        <UserProvider>
          <HeaderAuth />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <CookieBanner />
        </UserProvider>
      </body>
    </html>
  );
}
