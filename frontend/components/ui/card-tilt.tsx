"use client";

import { useRef, type ReactNode } from "react";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

import { cn } from "@/lib/utils";

// Wrapper "tilt 3D" — la card s'incline doucement vers le curseur
// (rotateX/Y), avec un highlight radial qui suit la souris pour
// renforcer l'effet de relief. Spring physics pour des transitions
// fluides au retour.
//
// Points clés de l'effet 3D vs une simple rotation :
//  1. PERSPECTIVE sur le parent (1100px) — sans ça les rotations
//     paraissent plates (transform 2D). C'est LE détail qui change tout.
//  2. AMPLITUDE marquée (±12° par défaut) — un tilt à ±6° passe
//     inaperçu sur les cards de la homepage.
//  3. GLARE OVERLAY qui suit le curseur — un radial-gradient blanc
//     ~18% opacity en mix-blend soft-light. C'est ce qui donne le
//     côté "carte de jeu premium" / hologramme.
//  4. PRESERVE-3D sur le contenu — permettrait du translateZ sur des
//     enfants (non utilisé ici, mais l'infra est en place).
//
// Désactivé naturellement sur touch devices (pas de mousemove).
// `prefers-reduced-motion` : motion lib réduit les springs par défaut
// pour les users ayant l'option système activée.

export interface CardTiltProps {
  children: ReactNode;
  /** Rotation Z statique (degrés) appliquée en base. Permet de garder
   *  une légère inclinaison artistique pendant que le tilt X/Y du
   *  curseur s'ajoute par-dessus. Default 0. */
  baseRotateZ?: number;
  /** Amplitude max du tilt en degrés (X et Y). Default 12. */
  maxTilt?: number;
  /** Intensité max du glare (0..1). Default 0.5. */
  glareOpacity?: number;
  /** Classe utilitaire pour le border-radius du wrapper. Doit matcher
   *  le radius de la card enfant pour que le glare ne déborde pas dans
   *  les coins. Default "rounded-2xl". */
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

  // Position curseur normalisée [-0.5..0.5] (relative à la taille de
  // la card → amplitude indépendante du gabarit).
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  // hover state [0..1] → drive l'opacity du glare (fade in/out propre).
  const hover = useMotionValue(0);

  // Mapping rotation : axe Y bouge avec X (et inversement). Les signes
  // sont choisis pour que la card s'incline VERS le curseur (effet
  // "elle me regarde") plutôt qu'à l'inverse (effet repoussant).
  const rotateXRaw = useTransform(mouseY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateYRaw = useTransform(mouseX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  // Position glare : suit le curseur en % (0 à 100 sur les 2 axes).
  const glareXRaw = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const glareYRaw = useTransform(mouseY, [-0.5, 0.5], [0, 100]);
  const glareOpacityRaw = useTransform(hover, [0, 1], [0, glareOpacity]);

  // Springs : transition fluide entre les positions. Le retour à 0 au
  // mouseLeave est animé via spring, donc pas de snap brutal.
  const springRot = { stiffness: 260, damping: 22, mass: 0.7 };
  const springGlare = { stiffness: 300, damping: 28 };
  const rotX = useSpring(rotateXRaw, springRot);
  const rotY = useSpring(rotateYRaw, springRot);
  const glareX = useSpring(glareXRaw, springGlare);
  const glareY = useSpring(glareYRaw, springGlare);
  const glareOp = useSpring(glareOpacityRaw, { stiffness: 200, damping: 30 });

  // Background du glare : radial centré sur le curseur. mix-blend
  // soft-light (sur la div) intensifie sans cramer.
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
    // Perspective sur le parent : indispensable pour donner du relief
    // aux rotations X/Y. Sans ça, le tilt paraît plat.
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
        {/* Glare overlay — radial qui suit le curseur, en mix-blend
            soft-light pour intensifier les highlights sans dominer.
            Clippé par overflow-hidden + cornerRadius du wrapper pour
            que le radial ne déborde pas dans les coins arrondis. */}
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
