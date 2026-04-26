/**
 * Vérifie si un match a déjà commencé.
 */
export function isStarted(dateStr: string): boolean {
  return new Date(dateStr) <= new Date();
}

/**
 * Vérifie si toutes les analyses d'une liste ont déjà commencé.
 */
export function allStarted(pronos: { startTime: string }[]): boolean {
  if (pronos.length === 0) return true;
  return pronos.every((p) => isStarted(p.startTime));
}

/**
 * Formate un startTime en texte lisible français.
 * - Si passé : "Match commencé"
 * - Si aujourd'hui : "Début à 20h45"
 * - Si demain : "Demain à 15h00"
 * - Sinon : "12 avr. à 18h30"
 */
export function formatStartTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  if (date <= now) return "Match commencé";

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const time = `${hours}h${minutes}`;

  if (date >= today && date < tomorrow) {
    return `Début à ${time}`;
  }

  if (date >= tomorrow && date < dayAfter) {
    return `Demain à ${time}`;
  }

  const day = date.getDate();
  const month = date.toLocaleDateString("fr-FR", { month: "short" });
  return `${day} ${month} à ${time}`;
}
