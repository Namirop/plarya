import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { cardCls } from "../_helpers";

export function EmptyState({
  message,
  hint,
  cta,
}: {
  message: string;
  hint: string;
  cta: { label: string; href: string };
}) {
  return (
    <div
      className={cn(
        cardCls,
        "relative mt-6 flex flex-col items-center gap-4 overflow-hidden px-6 py-12 text-center",
      )}
    >
      {/* Glow ambient — même pattern que IdentityHeader. Donne un peu de
          présence à l'état vide sans crier "ajoute-moi une illustration". */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/2 size-72 -translate-x-1/2 rounded-full bg-white/[0.03] blur-3xl"
      />
      <p className="relative font-body text-h5 text-foreground">{message}</p>
      <p className="relative max-w-md font-body text-body-16 text-muted-foreground">{hint}</p>
      <Button variant="secondary" size="md" render={<Link href={cta.href} />} className="relative mt-2">
        {cta.label}
      </Button>
    </div>
  );
}
