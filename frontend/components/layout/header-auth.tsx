"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { LoginModal, POST_LOGIN_REDIRECT_KEY } from "@/components/auth/login-modal";
import { Header } from "@/components/layout/header";
import { useUser } from "@/hooks/use-user";

// Wrapper client qui branche le Header DS sur l'auth maison (magic-link
// via `useUser`). Choisit automatiquement le variant `connected` /
// `guest` selon la présence d'une session utilisateur, et délègue les
// callbacks login/logout à `useUser` + `LoginModal`.
export function HeaderAuth() {
  const router = useRouter();
  const { user, loading, logout } = useUser();
  const [loginOpen, setLoginOpen] = useState(false);

  // 3 états distincts pour éviter le flash visuel :
  //  - "loading" : session en cours de résolution (premier appel
  //    /auth/me). Header rend juste le logo, ni nav ni boutons.
  //  - "connected" : user résolu, role connu.
  //  - "guest" : pas de user (anonyme).
  // Si on rendait "guest" pendant `loading`, on aurait un flash
  // "Se connecter / Créer un compte" pendant 50-200 ms au refresh
  // pour les users connectés.
  const variant: "connected" | "guest" | "loading" = loading
    ? "loading"
    : user
      ? "connected"
      : "guest";

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
