import { mobileCardCls } from "@/lib/admin-styles";
import { cn } from "@/lib/utils";

/** Cellule "aucun résultat" pour les tables desktop (colspan adaptatif). */
export function EmptyRow({ cols, message = "Aucun résultat" }: { cols: number; message?: string }) {
  return (
    <tr>
      <td
        colSpan={cols}
        className="px-4 py-12 text-center font-body text-body-16 italic text-muted-foreground"
      >
        {message}
      </td>
    </tr>
  );
}

/** Card "aucun résultat" pour le rendering mobile (sm:hidden). */
export function EmptyCard({ message = "Aucun résultat" }: { message?: string }) {
  return (
    <div className={cn(mobileCardCls, "text-center")}>
      <p className="font-body text-body-16 italic text-muted-foreground">{message}</p>
    </div>
  );
}
