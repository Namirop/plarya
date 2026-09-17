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

// Phosphor n'a pas d'icône de hockey : Trophy sert d'icône générique.
const SPORT_ICONS: Record<string, ComponentType<IconProps>> = {
  FOOTBALL: SoccerBall,
  TENNIS: TennisBall,
  BASKETBALL: Basketball,
  RUGBY: Football, // ballon ovale (football américain)
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
