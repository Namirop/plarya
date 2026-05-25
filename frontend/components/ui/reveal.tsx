"use client";

import { type ReactNode } from "react";

import { motion, type Variants } from "motion/react";

import { cn } from "@/lib/utils";

// Wrapper d'animation d'entrée au scroll : fade + slide-up.
// Joue une seule fois (viewport.once) quand l'élément entre dans le
// viewport avec une marge de -80px (= déclenche un peu avant que le
// haut de l'élément touche le bas de la fenêtre — anim visible).
//
// Utilisé sur les sections de la home pour donner un flow plus vivant
// au scroll. `delay` permet de stagger plusieurs Reveal voisins.
const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Delai (s) avant le start de l'anim. Utile pour stagger. */
  delay?: number;
  /** Durée de l'anim (s). Défaut 0.6. */
  duration?: number;
  /** Forcer un autre élément que `div` (ex: "section"). */
  as?: "div" | "section";
}

export function Reveal({
  children,
  className,
  delay = 0,
  duration = 0.6,
  as = "div",
}: RevealProps) {
  const Comp = as === "section" ? motion.section : motion.div;
  return (
    <Comp
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
    >
      {children}
    </Comp>
  );
}
