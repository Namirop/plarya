"use client";

import { useEffect, useState } from "react";

import { X } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

export type ToastVariant = "error" | "success" | "info";

export interface ToastProps {
  message: string;
  variant: ToastVariant;
  onClose: () => void;
  /** Fermeture automatique après N ms ; 0 la désactive. */
  duration?: number;
}

// Le ton n'est porté que par la bordure gauche.
const VARIANT_BORDERS: Record<ToastVariant, string> = {
  error: "border-l-destructive",
  success: "border-l-green-500",
  info: "border-l-accent",
};

export function Toast({ message, variant, onClose, duration = 5000 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Différé pour que la transition CSS d'entrée se déclenche.
    const t = window.setTimeout(() => setVisible(true), 10);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!duration || duration <= 0) return;
    const id = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(id);
  }, [duration, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto relative min-w-[320px] max-w-[480px]",
        "rounded-2xl border border-l-4 border-surface-elevated bg-background",
        "px-4 py-3 pr-12",
        "transition-all duration-300 ease-out",
        visible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
        VARIANT_BORDERS[variant],
      )}
    >
      <p className="font-body text-body-16 text-foreground">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer la notification"
        className="absolute right-2 top-2 cursor-pointer p-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
