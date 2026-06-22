export function HeaderLine({ num, date }: { num: number; date: string }) {
  return (
    <p className="font-body text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
      <span className="tabular-nums">
        Analyse №{num} · {date}
      </span>
    </p>
  );
}
