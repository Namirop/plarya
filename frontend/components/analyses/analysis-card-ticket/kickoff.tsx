import { formatTime } from "@/lib/analysis-format";

export function Kickoff({ started, startTime }: { started: boolean; startTime: string }) {
  return (
    <p className="mt-4 font-body text-sm text-muted-foreground">
      {started ? (
        <span className="text-destructive">Match commencé</span>
      ) : (
        <>Coup d&apos;envoi · {formatTime(startTime)}</>
      )}
    </p>
  );
}
