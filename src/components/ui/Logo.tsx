/**
 * SBT CABINS wordmark. A simple typographic mark with a modular-unit glyph.
 * (The eagle logo in the supplied PDFs reads "SBT SERVICES", so it is not
 * used for the SBT CABINS brand.)
 */
export function Logo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} dir="ltr">
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden="true">
        <rect x="1" y="1" width="38" height="38" rx="10" className="fill-accent" />
        <path d="M9 25.5h22M9 25.5V15.5l3-2.5h16l3 2.5v10" fill="none" className="stroke-accent-ink" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M13.5 25.5v-6h4v6M22 18.5h5v3.5h-5z" fill="none" className="stroke-accent-ink" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M8 29h24" className="stroke-accent-ink" strokeWidth="2.2" strokeLinecap="round" opacity=".55" />
      </svg>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[1.02rem] font-extrabold text-ink" style={{ fontFamily: "Manrope, sans-serif", letterSpacing: "0.14em" }}>SBT</span>
          <span className="mt-1 text-[0.62rem] font-medium text-accent" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.42em" }}>CABINS</span>
        </span>
      )}
    </span>
  );
}
