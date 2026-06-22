// Titre de section du compte. Pas de compteur entre parenthèses
// (pattern "dashboard IA") : le nombre d'items est déjà visible dans la
// liste qui suit.
export function AccountSectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span aria-hidden className="block h-7 w-px self-center bg-foreground" />
      <h2 className="font-body text-[22px] font-bold text-foreground md:text-[24px]">{title}</h2>
    </div>
  );
}
