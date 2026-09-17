export const eyebrowCls =
  "font-body text-[12px] font-semibold uppercase tracking-[0.2em] text-muted-foreground";

// Surtitre, titre et sous-titre centrés des sections formulaire et FAQ.
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center">
      <p className={eyebrowCls}>{eyebrow}</p>
      <h2 className="mt-3 font-body text-[36px] font-bold leading-[1.02] text-foreground md:text-[56px]">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-[560px] font-body text-body-16 text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}
