import type { Metadata } from "next";
import { Work_Sans, DM_Serif_Display } from "next/font/google";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
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
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </UserProvider>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="border-t border-bordure bg-fond-principal">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-texte-tertiaire">
            &copy; {new Date().getFullYear()} Plarya. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <Link
              href="/mentions-legales"
              className="text-sm text-texte-tertiaire hover:text-blanc transition-colors"
            >
              Mentions légales
            </Link>
            <Link
              href="/cgu"
              className="text-sm text-texte-tertiaire hover:text-blanc transition-colors"
            >
              CGU
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
