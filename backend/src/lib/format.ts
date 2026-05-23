// Format un montant en centimes vers une string FR "X,XX€" ou "X€"
// si entier. Identique au helper frontend lib/constants.ts:formatPrice
// (pas d'import cross-package — backend autonome).
export function formatPrice(cents: number): string {
  const euros = cents / 100;
  return euros % 1 === 0 ? `${euros.toFixed(0)}€` : `${euros.toFixed(2).replace(".", ",")}€`;
}

// Escape les caractères HTML dangereux d'une string user-controlled
// avant insertion dans un template HTML (emails, etc.). Empêche le
// XSS en email — ex : un expert qui set son pseudo en
// `</strong><script>...</script>` rendrait du HTML brut dans tous
// les emails envoyés à ses abonnés sans cet escape (les clients mail
// modernes isolent le JS mais peuvent rendre la réécriture du DOM
// → phishing visuel possible).
// Cf. audit-final.md §E.
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
