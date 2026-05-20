"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/layout/header";
import { LoginModal } from "@/components/auth/login-modal";
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

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <>
      <Header
        variant={variant}
        onSignIn={() => setLoginOpen(true)}
        onLogout={handleLogout}
      />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
