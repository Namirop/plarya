"use client";

import { type ReactNode } from "react";

import { motion, type Variants } from "motion/react";

import { cn } from "@/lib/utils";

// Apparition au scroll (fondu + glissement), jouée une seule fois quand
// l'élément est entré de 80 px dans la fenêtre.
const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Délai en secondes, pour décaler des éléments voisins. */
  delay?: number;
  /** Durée en secondes. */
  duration?: number;
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
