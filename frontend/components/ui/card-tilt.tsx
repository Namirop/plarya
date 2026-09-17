"use client";

import { useRef, type ReactNode } from "react";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

import { cn } from "@/lib/utils";

// Inclinaison 3D d'une carte vers le curseur, avec un reflet radial qui suit
// la souris (ressorts motion). Sans effet au toucher (pas de mousemove).

export interface CardTiltProps {
  children: ReactNode;
  /** Rotation Z fixe (degrés), à laquelle s'ajoute l'inclinaison X/Y. */
  baseRotateZ?: number;
  /** Inclinaison maximale en degrés. */
  maxTilt?: number;
  /** Opacité maximale du reflet (0..1). */
  glareOpacity?: number;
  /** Doit reprendre le rayon de la carte enfant pour que le reflet ne déborde pas. */
  cornerRadius?: string;
  className?: string;
}

export function CardTilt({
  children,
  baseRotateZ = 0,
  maxTilt = 12,
  glareOpacity = 0.5,
  cornerRadius = "rounded-2xl",
  className,
}: CardTiltProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Position du curseur normalisée [-0.5, 0.5], indépendante de la taille.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const hover = useMotionValue(0);

  // Signes choisis pour incliner la carte vers le curseur.
  const rotateXRaw = useTransform(mouseY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateYRaw = useTransform(mouseX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  const glareXRaw = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const glareYRaw = useTransform(mouseY, [-0.5, 0.5], [0, 100]);
  const glareOpacityRaw = useTransform(hover, [0, 1], [0, glareOpacity]);

  // Ressorts : le retour au repos après mouseLeave reste animé.
  const springRot = { stiffness: 260, damping: 22, mass: 0.7 };
  const springGlare = { stiffness: 300, damping: 28 };
  const rotX = useSpring(rotateXRaw, springRot);
  const rotY = useSpring(rotateYRaw, springRot);
  const glareX = useSpring(glareXRaw, springGlare);
  const glareY = useSpring(glareYRaw, springGlare);
  const glareOp = useSpring(glareOpacityRaw, { stiffness: 200, damping: 30 });

  const glareBackground = useTransform(
    [glareX, glareY],
    ([x, y]) =>
      `radial-gradient(circle at ${x as number}% ${y as number}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%)`,
  );

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - left) / width - 0.5);
    mouseY.set((e.clientY - top) / height - 0.5);
  }

  function handleMouseEnter() {
    hover.set(1);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
    hover.set(0);
  }

  return (
    // Sans perspective sur le parent, les rotations X/Y paraissent plates.
    <div className={cn("[perspective:1100px]", className)}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: rotX,
          rotateY: rotY,
          rotateZ: baseRotateZ,
          transformStyle: "preserve-3d",
        }}
        className={cn("relative transform-gpu overflow-hidden", cornerRadius)}
      >
        {children}
        {/* Reflet, découpé par overflow-hidden et cornerRadius. */}
        <motion.div
          aria-hidden
          style={{
            background: glareBackground,
            opacity: glareOp,
          }}
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        />
      </motion.div>
    </div>
  );
}
