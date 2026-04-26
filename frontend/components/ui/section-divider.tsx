export function SectionDivider() {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      aria-hidden="true"
    >
      {/* Left line */}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#1A1A1A] to-[#2A2A2A]" />

      {/* Center mark */}
      <div className="relative mx-4 flex items-center gap-2">
        <div className="w-16 sm:w-24 h-px bg-gradient-to-r from-transparent to-[#00D47E]/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#00D47E]/70 shadow-[0_0_20px_rgba(0,212,126,0.5)]" />
        <div className="w-16 sm:w-24 h-px bg-gradient-to-l from-transparent to-[#00D47E]/50" />
      </div>

      {/* Right line */}
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#1A1A1A] to-[#2A2A2A]" />
    </div>
  );
}
