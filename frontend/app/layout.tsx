// Polices locales sous licence SIL OFL : Mona Sans (texte), Hubot Sans (titres).
// display "swap" : le texte s'affiche avant le chargement de la police.

import localFont from "next/font/local";

import type { Metadata } from "next";

import { FlagEmojiPolyfill } from "@/components/layout/flag-emoji-polyfill";
import { HeaderAuth } from "@/components/layout/header-auth";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { UserProvider } from "@/hooks/use-user";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, serializeJsonLd } from "@/lib/site";
import "./globals.css";

const monaSans = localFont({
  src: "../public/fonts/Mona-Sans.woff2",
  variable: "--font-mona-sans",
  display: "swap",
});

const hubotSans = localFont({
  src: "../public/fonts/Hubot-Sans.ttf",
  variable: "--font-hubot-sans",
  display: "swap",
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
    // Pas d'image OG globale : seules les pages expert en génèrent une.
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

// Données structurées Organization et WebSite (résultats enrichis).
const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/full-logo-remove.png`,
  description: SITE_DESCRIPTION,
};

// Pas de SearchAction : le site n'a pas de recherche.
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
    <html lang="fr" className={`${monaSans.variable} ${hubotSans.variable}`}>
      <body className="min-h-screen flex flex-col">
        {/* Contenu statique, échappé par serializeJsonLd. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteLd) }}
        />
        <FlagEmojiPolyfill />
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
