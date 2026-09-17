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

// Au-delà, les plus anciens sont retirés.
const MAX_TOASTS = 3;

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    toastIdCounter += 1;
    const id = toastIdCounter;
    setToasts((prev) => {
      const next = [...prev, { id, message, variant }];
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    });
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* pointer-events-none : les zones vides ne bloquent pas la page. */}
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
