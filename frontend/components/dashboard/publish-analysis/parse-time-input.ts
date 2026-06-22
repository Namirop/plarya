/**
 * Parse une heure tapée librement par l'expert. Accepte les formats :
 *  - "18h30", "18:30", "18 30", "1830"
 *  - "18h" (minutes implicites = 0)
 *
 * Retourne null si le format n'est pas reconnu ou si l'heure est
 * hors-bornes (h > 23 ou min > 59). Le composant caller affiche un
 * message d'erreur sur null.
 */
export function parseTimeInput(raw: string): { hours: number; minutes: number } | null {
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (!cleaned) return null;

  let h: number | undefined;
  let min: number | undefined;

  // Format 4 chiffres collés "1830"
  if (/^\d{4}$/.test(cleaned)) {
    h = parseInt(cleaned.slice(0, 2), 10);
    min = parseInt(cleaned.slice(2), 10);
  }
  // Formats avec séparateur "18h30" / "18:30" / éventuellement "18h"
  else {
    const m = cleaned.match(/^(\d{1,2})[h:](\d{0,2})$/) || cleaned.match(/^(\d{1,2})(h)?$/);
    if (!m) return null;
    h = parseInt(m[1], 10);
    min = m[2] && /^\d+$/.test(m[2]) ? parseInt(m[2], 10) : 0;
  }

  if (h === undefined || min === undefined) return null;
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { hours: h, minutes: min };
}
