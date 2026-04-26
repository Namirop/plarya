"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { LoginModal } from "@/components/auth/login-modal";

const navLinkClass =
  "px-4 py-1.5 text-sm font-medium text-texte-secondaire hover:text-blanc hover:bg-white/[0.06] rounded-md transition-all";

export function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, logout } = useUser();
  const [mounted, setMounted] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const showAuth = mounted && !loading;
  const isTipster = user?.role === "TIPSTER";
  const isAdmin = user?.role === "ADMIN";

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <>
      <header className="navbar-enter sticky top-0 z-50 border-b border-bordure bg-fond-principal/95 backdrop-blur-md">
        <nav className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-12 grid grid-cols-[1fr_auto_1fr] md:flex md:items-center md:justify-between items-center">
          {/* Mobile: empty left spacer */}
          <div className="md:hidden" />

          <Link
            href="/"
            className="flex items-center justify-center md:justify-start pt-3 md:pt-1.5"
          >
            <Image
              src="/full-logo-remove.png"
              alt="Plarya"
              width={400}
              height={100}
              className="h-12 w-auto md:h-12"
              priority
            />
          </Link>

          {/* Right column — desktop nav + mobile hamburger */}
          <div className="flex justify-end">
            {/* Desktop nav */}
            <div className="hidden md:flex">
              {showAuth && (
                <div className="flex items-center gap-1 rounded-lg border border-bordure bg-white/[0.02] px-1.5 py-1">
                  {user ? (
                    <>
                      {!isTipster && !isAdmin && (
                        <Link href="/devenir-tipster" className={navLinkClass}>
                          Devenir Expert
                        </Link>
                      )}
                      {isTipster && (
                        <>
                          <Link href="/dashboard" className={navLinkClass}>
                            Dashboard
                          </Link>
                          <Link href="/compte" className={navLinkClass}>
                            Mon compte
                          </Link>
                        </>
                      )}
                      {isAdmin && (
                        <Link href="/admin" className={navLinkClass}>
                          Admin
                        </Link>
                      )}
                      <button onClick={handleLogout} className={navLinkClass}>
                        Déconnexion
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/devenir-tipster" className={navLinkClass}>
                        Devenir Expert
                      </Link>
                      <button
                        onClick={() => setLoginModalOpen(true)}
                        className={navLinkClass}
                      >
                        Se connecter
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex flex-col gap-1.5 p-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <span
                className={`block h-0.5 w-6 bg-blanc transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
              />
              <span
                className={`block h-0.5 w-6 bg-blanc transition-opacity ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-0.5 w-6 bg-blanc transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
              />
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-bordure bg-fond-principal px-4 py-4 flex flex-col gap-1">
            {showAuth && (
              <>
                {user ? (
                  <>
                    {!isTipster && !isAdmin && (
                      <Link
                        href="/devenir-tipster"
                        className="px-3 py-2 text-sm font-medium text-texte-secondaire hover:text-blanc hover:bg-white/[0.06] rounded-md transition-all"
                        onClick={() => setMenuOpen(false)}
                      >
                        Devenir Expert
                      </Link>
                    )}
                    {isTipster && (
                      <>
                        <Link
                          href="/dashboard"
                          className="px-3 py-2 text-sm font-medium text-texte-secondaire hover:text-blanc hover:bg-white/[0.06] rounded-md transition-all"
                          onClick={() => setMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/compte"
                          className="px-3 py-2 text-sm font-medium text-texte-secondaire hover:text-blanc hover:bg-white/[0.06] rounded-md transition-all"
                          onClick={() => setMenuOpen(false)}
                        >
                          Mon compte
                        </Link>
                      </>
                    )}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="px-3 py-2 text-sm font-medium text-texte-secondaire hover:text-blanc hover:bg-white/[0.06] rounded-md transition-all"
                        onClick={() => setMenuOpen(false)}
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setMenuOpen(false);
                      }}
                      className="px-3 py-2 text-sm font-medium text-texte-secondaire hover:text-blanc hover:bg-white/[0.06] rounded-md transition-all text-left"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/devenir-tipster"
                      className="px-3 py-2 text-sm font-medium text-texte-secondaire hover:text-blanc hover:bg-white/[0.06] rounded-md transition-all"
                      onClick={() => setMenuOpen(false)}
                    >
                      Devenir Expert
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setLoginModalOpen(true);
                      }}
                      className="px-3 py-2 text-sm font-medium text-texte-secondaire hover:text-blanc hover:bg-white/[0.06] rounded-md transition-all text-left"
                    >
                      Se connecter
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </header>

      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </>
  );
}
