// Échappe une chaîne saisie par un utilisateur avant insertion dans du HTML
// (emails) : sans cela, un pseudo contenant des balises injecterait du
// contenu arbitraire dans les emails envoyés aux abonnés.
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
