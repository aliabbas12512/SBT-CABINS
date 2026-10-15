import type { CSSProperties } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Indicative section for portable toilets: roof water tank above, septic tank
 * below. Capacities are printed only when the client stated them.
 */
export function ToiletSection({
  length,
  waterLitres,
  septicLitres,
  dict,
  locale,
  title,
  className,
}: {
  length: number;
  waterLitres?: number;
  septicLitres?: number;
  dict: Dictionary;
  locale: Locale;
  title: string;
  className?: string;
}) {
  const S = 520 / Math.max(length, 4); // px per metre, keeps small units readable
  const L = length * S;
  const H = 2.5 * S;
  const tankW = Math.min(L * 0.38, 1.6 * S);
  const tankH = Math.min(0.9 * S, tankW * 0.7);
  const sepW = Math.min(L * 0.6, 3.0 * S);
  const sepH = Math.min(1.1 * S, 120);
  const groundY = H + 0.25 * S;
  const st = (c: string, w: number, extra: CSSProperties = {}): CSSProperties => ({ stroke: c, strokeWidth: w, fill: "none", ...extra });
  const lbl: CSSProperties = { fill: "var(--dw-label)", fontWeight: 700 };
  const sub: CSSProperties = { fill: "var(--dw-sublabel)", fontWeight: 600 };
  const fmt = (n: number) => `${n.toLocaleString("en-US")} ${locale === "ar" ? "لتر" : "L"}`;
  const water = waterLitres ? `${dict.drawing.waterTank} — ${fmt(waterLitres)}` : dict.drawing.waterTank;
  const septic = septicLitres ? `${dict.drawing.septicTank} — ${fmt(septicLitres)}` : dict.drawing.septicTank;
  const tx = L * 0.62 - tankW / 2;
  const sx = L * 0.5 - sepW / 2;
  const right = Math.max(L + 140, sx + sepW + 340, tx + tankW + 340);

  return (
    <svg viewBox={`-150 ${-tankH - 70} ${right + 160} ${groundY + sepH + 0.6 * S + tankH + 90}`} className={className} role="img" aria-label={title} direction="ltr" style={{ fontFamily: "var(--font-sans)" }}>
      <title>{title}</title>
      {/* Ground */}
      <rect x={-140} y={groundY} width={right + 140} height={sepH + 0.6 * S} style={{ fill: "var(--dw-accent-soft)" }} />
      <line x1={-140} y1={groundY} x2={right} y2={groundY} style={st("var(--dw-fixture)", 2)} />
      {/* Building */}
      <rect x={0} y={0} width={L} height={H} style={{ fill: "var(--dw-room)", stroke: "var(--dw-wall)", strokeWidth: 3 }} />
      <rect x={0} y={H} width={L} height={0.25 * S} style={{ fill: "var(--dw-wet)", stroke: "var(--dw-partition)", strokeWidth: 1.5 }} />
      {/* Roof water tank */}
      <rect x={tx} y={-tankH} width={tankW} height={tankH} rx={10} style={{ fill: "var(--dw-wet)", stroke: "var(--dw-accent)", strokeWidth: 2.5 }} />
      <text x={tx + tankW + 12} y={-tankH / 2 + 5} fontSize={15} style={lbl}>
        {water}
      </text>
      {/* Septic tank below ground */}
      <rect x={sx} y={groundY + 0.25 * S} width={sepW} height={sepH} rx={8} style={{ fill: "var(--dw-paper)", stroke: "var(--dw-accent)", strokeWidth: 2.5, strokeDasharray: "8 6" }} />
      <text x={sx + sepW + 12} y={groundY + 0.25 * S + sepH / 2 + 5} fontSize={15} style={lbl}>
        {septic}
      </text>
      {/* Supply and drain lines */}
      <path d={`M ${tx + tankW / 2} 0 L ${tx + tankW / 2} ${H * 0.35}`} style={st("var(--dw-window)", 2.5, { strokeDasharray: "6 5" })} />
      <path d={`M ${L * 0.35} ${H + 0.25 * S} L ${L * 0.35} ${groundY + 0.25 * S}`} style={st("var(--dw-partition)", 3)} />
      <text x={L / 2} y={H / 2} textAnchor="middle" fontSize={16} style={sub}>
        {dict.drawing.toiletUnit}
      </text>
      <text x={L} y={groundY + sepH + 0.6 * S - 10} textAnchor="end" fontSize={12} style={sub}>
        {dict.drawing.notToScale}
      </text>
    </svg>
  );
}
