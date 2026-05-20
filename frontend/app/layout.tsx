import type { Metadata } from "next";
import { Work_Sans, DM_Serif_Display } from "next/font/google";
import Link from "next/link";
import { HeaderAuth } from "@/components/layout/header-auth";
import { UserProvider } from "@/hooks/use-user";
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
  title: "Plarya — Plateforme d'analyses sportives premium",
  description: "Les meilleurs experts, des analyses sportives gagnantes",
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
        <UserProvider>
          <HeaderAuth />
          <main className="flex-1">{children}</main>
          <Footer />
        </UserProvider>
      </body>
    </html>
  );
}

function Footer() {
  const linkClass =
    "font-body text-body-16 text-muted-foreground hover:text-foreground transition-colors";
  return (
    <footer className="border-t border-white/5 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="font-body text-body-16 text-muted-foreground">
            &copy; {new Date().getFullYear()} Plarya. Tous droits réservés.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/confidentialite" className={linkClass}>
              Confidentialité
            </Link>
            <Link href="/mentions-legales" className={linkClass}>
              Mentions légales
            </Link>
            <Link href="/cgu" className={linkClass}>
              CGU
            </Link>
            <Link href="/contact" className={linkClass}>
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
