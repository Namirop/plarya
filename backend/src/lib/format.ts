// Format un montant en centimes vers une string FR "X,XX€" ou "X€"
// si entier. Identique au helper frontend lib/constants.ts:formatPrice
// (pas d'import cross-package — backend autonome).
export function formatPrice(cents: number): string {
  const euros = cents / 100;
  return euros % 1 === 0
    ? `${euros.toFixed(0)}€`
    : `${euros.toFixed(2).replace(".", ",")}€`;
}
