"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { LoginModal, POST_LOGIN_REDIRECT_KEY } from "@/components/auth/login-modal";
import { Header } from "@/components/layout/header";
import { useUser } from "@/hooks/use-user";

// Relie le Header à la session (useUser) et à la LoginModal. Connexion et
// création de compte suivent le même flux magic-link ; seul le texte change.
type LoginIntent = "signin" | "signup" | null;

export function HeaderAuth() {
  const router = useRouter();
  const { user, loading, logout } = useUser();
  const [loginIntent, setLoginIntent] = useState<LoginIntent>(null);

  // "loading" tant que /auth/me n'a pas répondu, pour ne pas afficher
  // brièvement les boutons invité à un utilisateur connecté.
  const variant: "connected" | "guest" | "loading" = loading
    ? "loading"
    : user
      ? "connected"
      : "guest";

  // Destination post-connexion mémorisée par LoginModal avant l'envoi du
  // magic-link, consommée dès que l'utilisateur est résolu.
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
