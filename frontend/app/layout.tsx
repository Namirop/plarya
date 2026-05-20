import type { Metadata } from "next";
import { Work_Sans, DM_Serif_Display } from "next/font/google";
import { HeaderAuth } from "@/components/layout/header-auth";
import { SiteFooter } from "@/components/layout/site-footer";
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
          <SiteFooter />
        </UserProvider>
      </body>
    </html>
  );
}
