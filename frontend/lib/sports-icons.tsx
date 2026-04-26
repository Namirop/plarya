import { Icon } from "@iconify/react";

const SPORT_ICONS: Record<string, string> = {
  FOOTBALL: "tabler:ball-football",
  TENNIS: "tabler:ball-tennis",
  BASKETBALL: "tabler:ball-basketball",
  RUGBY: "tabler:ball-american-football",
  HOCKEY: "material-symbols:sports-hockey",
  MMA: "material-symbols:sports-mma-outline",
  BOXE: "material-symbols:sports-mma-outline",
  ESPORT: "tabler:device-gamepad-2",
  AUTRE: "tabler:trophy",
};

export function SportIcon({
  sport,
  className = "size-4",
}: {
  sport: string;
  className?: string;
}) {
  const iconName = SPORT_ICONS[sport] || "tabler:trophy";
  return <Icon icon={iconName} className={className} />;
}
