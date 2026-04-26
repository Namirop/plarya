import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devenir expert — Plarya",
  description:
    "Rejoignez Plarya en tant qu'expert et partagez vos analyses sportives.",
};

export default function DevenirTipsterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
