import { LockedBlock, SectionLabel } from "./primitives";

export function ArgumentBlock({
  hasAccess,
  argument,
}: {
  hasAccess: boolean;
  argument: string | null;
}) {
  return (
    <>
      <SectionLabel>L&apos;analyse</SectionLabel>
      {hasAccess ? (
        <p className="font-body text-base leading-[1.65] text-foreground/90">
          {argument || "Argumentaire non communiqué."}
        </p>
      ) : (
        <LockedBlock fullWidth>
          <p className="font-body text-base leading-[1.65] text-foreground blur-[7px]">
            ●●●●●●●●●● ●●●●●●●● ●●●●●●●●●●●● ●●●●●● ●●●●●●●●● ●●●● ●●●●●●●●●● ●●●●●●●.
          </p>
        </LockedBlock>
      )}
    </>
  );
}
