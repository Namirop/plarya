export const TEASING_LABELS: Record<string, string> = {
  PICK_SOLIDE: "🎯 Pick solide",
  VALUE: "💣 Value",
  SAFE: "🔒 Safe",
  OPPORTUNITE: "📈 Opportunité",
  PICK_DU_JOUR: "🚨 Pick du jour",
  A_NE_PAS_RATER: "👀 À ne pas rater",
};

export const TEASING_OPTIONS = [
  { value: "PICK_SOLIDE", label: "🎯 Pick solide" },
  { value: "VALUE", label: "💣 Value" },
  { value: "SAFE", label: "🔒 Safe" },
  { value: "OPPORTUNITE", label: "📈 Opportunité" },
  { value: "PICK_DU_JOUR", label: "🚨 Pick du jour" },
  { value: "A_NE_PAS_RATER", label: "👀 À ne pas rater" },
] as const;

/** Format cents to display price (e.g. 350 → "3,50", 1900 → "19") */
export function formatPrice(cents: number): string {
  const euros = cents / 100;
  return euros % 1 === 0 ? euros.toFixed(0) : euros.toFixed(2).replace(".", ",");
}

export const SPORT_LABELS: Record<string, string> = {
  FOOTBALL: "⚽ Football",
  TENNIS: "🎾 Tennis",
  BASKETBALL: "🏀 Basketball",
  RUGBY: "🏉 Rugby",
  HOCKEY: "🏒 Hockey",
  MMA: "🥊 MMA",
  BOXE: "🥊 Boxe",
  ESPORT: "🎮 Esport",
  AUTRE: "🏅 Autre",
};
