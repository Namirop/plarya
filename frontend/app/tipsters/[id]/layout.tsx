import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil expert — Plarya",
  description: "Consultez le profil, les statistiques et les analyses de cet expert.",
};

export default function TipsterProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
