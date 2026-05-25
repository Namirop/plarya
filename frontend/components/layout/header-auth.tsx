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
// Intent piloté par le bouton cliqué dans le Header : signin ouvre la
// LoginModal en mode "connexion", signup en mode "création de compte".
// Le flow backend est identique (magic-link) — seul le copy diffère.
type LoginIntent = "signin" | "signup" | null;

export function HeaderAuth() {
  const router = useRouter();
  const { user, loading, logout } = useUser();
  const [loginIntent, setLoginIntent] = useState<LoginIntent>(null);

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

  const isSignup = loginIntent === "signup";

  return (
    <>
      <Header
        variant={variant}
        role={user?.role ?? "USER"}
        onSignIn={() => setLoginIntent("signin")}
        onSignUp={() => setLoginIntent("signup")}
        onLogout={handleLogout}
      />
      <LoginModal
        open={loginIntent !== null}
        onClose={() => setLoginIntent(null)}
        title={isSignup ? "Créer un compte" : "Se connecter"}
        description={
          isSignup
            ? "Entre ton email — on t'envoie un lien pour créer ton compte. Pas de mot de passe."
            : "Entre ton email pour recevoir un lien de connexion."
        }
      />
    </>
  );
}
