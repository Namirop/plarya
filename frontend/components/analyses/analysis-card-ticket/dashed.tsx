import { cn } from "@/lib/utils";

/** Perforation horizontale — dashes contrôlés (≈5px trait / 6px vide),
 *  blanc ~22 % : visible mais sobre. */
export function Dashed({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "my-5 h-px w-full bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.22)_0,rgba(255,255,255,0.22)_5px,transparent_5px,transparent_11px)]",
        className,
      )}
    />
  );
}

/** Perforation verticale — ligne de déchirure du talon (desktop). */
export function DashedV({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "w-px bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.22)_0,rgba(255,255,255,0.22)_5px,transparent_5px,transparent_11px)]",
        className,
      )}
    />
  );
}
