"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import { Toast, type ToastVariant } from "./toast";

interface ToastEntry {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Cap à 3 toasts simultanés — au-delà, on shift les plus anciens.
const MAX_TOASTS = 3;

// Compteur module-level (id unique d'un toast à l'autre, persiste
// entre rerenders du provider — un useRef ferait l'affaire mais
// le compteur module est plus simple ici).
let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    toastIdCounter += 1;
    const id = toastIdCounter;
    setToasts((prev) => {
      const next = [...prev, { id, message, variant }];
      // Cap : si on dépasse, on garde les MAX_TOASTS plus récents.
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    });
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Conteneur — fixed bottom-right, stack vertical. pointer-events
          none sur le wrapper pour ne pas bloquer les clics sur la page
          dans les zones vides ; le Toast lui-même remet pointer-events
          auto pour rester cliquable. */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} variant={t.variant} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
