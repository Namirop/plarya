import type { ComponentType } from "react";

import type { IconProps } from "@phosphor-icons/react";
import {
  SoccerBall,
  TennisBall,
  Basketball,
  Football,
  BoxingGlove,
  GameController,
  Trophy,
} from "@phosphor-icons/react";

// Mapping sport → composant Phosphor. Phosphor n'a pas d'icône hockey
// dédiée à ce jour ; on fallback sur Trophy (acceptable visuellement
// — hockey reste minoritaire en France de toute façon).
const SPORT_ICONS: Record<string, ComponentType<IconProps>> = {
  FOOTBALL: SoccerBall,
  TENNIS: TennisBall,
  BASKETBALL: Basketball,
  RUGBY: Football, // Football américain Phosphor = forme ovale rugby
  HOCKEY: Trophy,
  MMA: BoxingGlove,
  BOXE: BoxingGlove,
  ESPORT: GameController,
  AUTRE: Trophy,
};

export function SportIcon({ sport, className = "size-4" }: { sport: string; className?: string }) {
  const IconCmp = SPORT_ICONS[sport] || Trophy;
  return <IconCmp className={className} />;
}
