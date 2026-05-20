"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Routes "internes" (app-like) sur lesquelles on ne rend PAS le footer.
// Convention décidée pour le Dashboard ; à étendre quand l'admin et le
// compte arriveront.
const HIDDEN_PREFIXES = ["/dashboard", "/admin"];

export function SiteFooter() {
  const pathname = usePathname();
  if (HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

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
