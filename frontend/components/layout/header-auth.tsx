"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/layout/header";
import { LoginModal, POST_LOGIN_REDIRECT_KEY } from "@/components/auth/login-modal";
import { useUser } from "@/hooks/use-user";

// Wrapper client qui branche le Header DS sur l'auth maison (magic-link
// via `useUser`). Choisit automatiquement le variant `connected` /
// `guest` selon la présence d'une session utilisateur, et délègue les
// callbacks login/logout à `useUser` + `LoginModal`.
export function HeaderAuth() {
  const router = useRouter();
  const { user, loading, logout } = useUser();
  const [loginOpen, setLoginOpen] = useState(false);

  // Tant que la session n'est pas chargée, on rend le variant guest
  // par défaut — évite un flash "connected → guest" si l'auth échoue
  // après hydratation.
  const variant = !loading && user ? "connected" : "guest";

  // Redirect post-login : LoginModal stocke la destination dans
  // sessionStorage avant d'envoyer le magic-link. Au retour de
  // `/auth/verify`, le cookie est posé, `useUser` re-fetch et `user`
  // passe de null à défini → on consomme la destination ici.
  useEffect(() => {
    if (loading || !user || typeof window === "undefined") return;
    const target = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
    if (!target) return;
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    router.push(target);
  }, [user, loading, router]);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <>
      <Header
        variant={variant}
        role={user?.role ?? "USER"}
        onSignIn={() => setLoginOpen(true)}
        onLogout={handleLogout}
      />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
