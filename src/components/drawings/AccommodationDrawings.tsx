import type { CSSProperties, ReactNode } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

/**
 * Drawings for the 12.00 × 3.60 m Portable Accommodation Cabin, re-drawn from
 * the supplied technical specification (pages 2, 4, 5, 6, 7 and 16). Values
 * and labels match the source; all are marked "indicative" as in the source.
 */

type Props = { dict: Dictionary; locale: Locale; className?: string };
const S = 60; // 1 m = 60 user units for the 12 m drawings

const stroke = (color: string, w: number, extra: CSSProperties = {}): CSSProperties => ({ stroke: color, strokeWidth: w, fill: "none", ...extra });
const label: CSSProperties = { fill: "var(--dw-label)", fontWeight: 700 };
const sub: CSSProperties = { fill: "var(--dw-sublabel)", fontWeight: 600 };
const dimText: CSSProperties = { fill: "var(--dw-dim)", fontWeight: 700 };

function Svg({ title, viewBox, className, children }: { id?: string; title: string; viewBox: string; className?: string; children: ReactNode }) {
  return (
    <svg viewBox={viewBox} className={className} role="img" aria-label={title} direction="ltr" style={{ fontFamily: "var(--font-sans)" }}>
      <title>{title}</title>
      {children}
    </svg>
  );
}

function HDim({ x1, x2, y, text, size = 14 }: { x1: number; x2: number; y: number; text: string; size?: number }) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} style={stroke("var(--dw-dim)", 1.4)} />
      <path d={`M ${x1 + 8} ${y - 4} L ${x1} ${y} L ${x1 + 8} ${y + 4}`} style={stroke("var(--dw-dim)", 1.4)} />
      <path d={`M ${x2 - 8} ${y - 4} L ${x2} ${y} L ${x2 - 8} ${y + 4}`} style={stroke("var(--dw-dim)", 1.4)} />
      <text x={(x1 + x2) / 2} y={y - 6} textAnchor="middle" fontSize={size} style={dimText}>
        {text}
      </text>
    </g>
  );
}

function VDim({ x, y1, y2, text, size = 14 }: { x: number; y1: number; y2: number; text: string; size?: number }) {
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2} style={stroke("var(--dw-dim)", 1.4)} />
      <path d={`M ${x - 4} ${y1 + 8} L ${x} ${y1} L ${x + 4} ${y1 + 8}`} style={stroke("var(--dw-dim)", 1.4)} />
      <path d={`M ${x - 4} ${y2 - 8} L ${x} ${y2} L ${x + 4} ${y2 - 8}`} style={stroke("var(--dw-dim)", 1.4)} />
      <text x={x - 8} y={(y1 + y2) / 2} textAnchor="middle" fontSize={size} transform={`rotate(-90 ${x - 8} ${(y1 + y2) / 2})`} style={dimText}>
        {text}
      </text>
    </g>
  );
}

/** Page 2 — side elevation (indicative). */
export function SideElevation({ dict, locale, className }: Props) {
  const m = locale === "ar" ? "م" : "m";
  const L = 12 * S;
  const H = 2.75 * S;
  const x = (v: number) => v * S;
  return (
    <Svg id="acc-elev" title={dict.drawing.sideElevation} viewBox={`-70 -40 ${L + 110} ${H + 130}`} className={className}>
      <rect x={0} y={0} width={L} height={H} style={{ fill: "var(--dw-room)", stroke: "var(--dw-wall)", strokeWidth: 3 }} />
      {/* skid */}
      <rect x={0} y={H} width={L} height={0.3 * S} style={{ fill: "var(--dw-wet)", stroke: "var(--dw-partition)", strokeWidth: 1.5 }} />
      {/* step at main door */}
      <path d={`M ${x(0.7)} ${H + 0.3 * S + 14} L ${x(1.0)} ${H + 0.3 * S} L ${x(2.0)} ${H + 0.3 * S} L ${x(2.0)} ${H + 0.3 * S + 14} Z`} style={{ fill: "var(--dw-fixture)", opacity: 0.55 }} />
      {/* main door 1.00 × 2.00 */}
      <rect x={x(1.0)} y={H - x(2.0)} width={x(1.0)} height={x(2.0)} style={stroke("var(--dw-wall)", 2.4)} />
      <text x={x(1.0)} y={-12} fontSize={12} style={sub}>
        {dict.drawing.mainDoor}
      </text>
      <line x1={x(1.25)} y1={-8} x2={x(1.25)} y2={H - x(2.0)} style={stroke("var(--dw-fixture)", 1, { strokeDasharray: "2 3" })} />
      {/* windows */}
      {[3.1, 5.5, 7.9].map((wx) => (
        <rect key={wx} x={x(wx)} y={x(0.8)} width={x(1.0)} height={x(0.78)} style={{ fill: "var(--dw-paper)", stroke: "var(--dw-window)", strokeWidth: 2.2 }} />
      ))}
      {/* AC units */}
      {[2.2, 8.6].map((ax) => (
        <g key={ax}>
          <rect x={x(ax)} y={x(0.15)} width={x(0.8)} height={x(0.48)} style={{ fill: "var(--dw-wet)", stroke: "var(--dw-fixture)", strokeWidth: 1.5 }} />
          <circle cx={x(ax + 0.4)} cy={x(0.39)} r={9} style={stroke("var(--dw-fixture)", 1.5)} />
        </g>
      ))}
      {/* emergency exit (dashed) */}
      <rect x={x(10.0)} y={H - x(2.0)} width={x(1.0)} height={x(2.0)} style={stroke("var(--dw-wall)", 2.2, { strokeDasharray: "7 5" })} />
      <text x={x(11.0)} y={-12} fontSize={12} textAnchor="end" style={sub}>
        {dict.drawing.emergencyExit}
      </text>
      <line x1={x(10.75)} y1={-8} x2={x(10.75)} y2={H - x(2.0)} style={stroke("var(--dw-fixture)", 1, { strokeDasharray: "2 3" })} />
      <HDim x1={0} x2={L} y={H + 0.3 * S + 44} text={`12.00 ${m}`} />
      <VDim x={-30} y1={0} y2={H} text={`2.75 ${m}`} />
    </Svg>
  );
}

/** Page 4 — skid plan. */
export function SkidPlan({ dict, locale, className }: Props) {
  const m = locale === "ar" ? "م" : "m";
  const L = 12 * S;
  const W = 3.6 * S;
  const x = (v: number) => v * S;
  const beams = [0.6, 3.0];
  return (
    <Svg id="acc-skid" title={dict.drawing.skidPlan} viewBox={`-90 -46 ${L + 130} ${W + 150}`} className={className}>
      {/* checkered plate lifting zones */}
      {[3.0, 9.0].map((lx) => (
        <rect key={lx} x={x(lx - 0.45)} y={x(0.45)} width={x(0.9)} height={x(2.7)} style={{ fill: "var(--dw-accent-soft)" }} />
      ))}
      {/* cabin outline (dashed) */}
      <rect x={0} y={0} width={L} height={W} style={stroke("var(--dw-fixture)", 1.6, { strokeDasharray: "8 6" })} />
      {/* cross members */}
      {[0, 3.0, 9.0, 12].map((cx) => (
        <line key={cx} x1={x(cx)} y1={x(0.6)} x2={x(cx)} y2={x(3.0)} style={stroke("var(--dw-partition)", 1.6)} />
      ))}
      {/* longitudinal beams */}
      {beams.map((by) => (
        <g key={by}>
          <rect x={0} y={x(by) - 7} width={L} height={14} style={{ fill: "var(--dw-wet)", stroke: "var(--dw-wall)", strokeWidth: 2 }} />
          <line x1={0} y1={x(by)} x2={L} y2={x(by)} style={stroke("var(--dw-wall)", 1)} />
        </g>
      ))}
      {/* forklift pockets */}
      {[4.25, 7.05].map((fx) =>
        beams.map((by) => (
          <rect key={`${fx}-${by}`} x={x(fx)} y={x(by) - 9} width={x(0.72)} height={18} style={{ fill: "var(--dw-paper)", stroke: "var(--dw-fixture)", strokeWidth: 1.6 }} />
        )),
      )}
      {/* lifting points */}
      {[3.0, 9.0].map((lx) =>
        beams.map((by) => (
          <g key={`${lx}-${by}`}>
            <circle cx={x(lx)} cy={x(by)} r={10} style={{ fill: "var(--dw-paper)", stroke: "var(--dw-accent)", strokeWidth: 2.4 }} />
            <path d={`M ${x(lx) - 5} ${x(by) - 5} L ${x(lx) + 5} ${x(by) + 5} M ${x(lx) + 5} ${x(by) - 5} L ${x(lx) - 5} ${x(by) + 5}`} style={stroke("var(--dw-accent)", 2)} />
          </g>
        )),
      )}
      <text x={x(3.0)} y={-14} textAnchor="middle" fontSize={12} style={{ ...label, fill: "var(--dw-accent)" }}>
        {dict.drawing.liftingPointLabel}
      </text>
      <text x={x(9.0)} y={-14} textAnchor="middle" fontSize={12} style={{ ...label, fill: "var(--dw-accent)" }}>
        {dict.drawing.liftingPointLabel}
      </text>
      <text x={x(6.0)} y={x(1.85)} textAnchor="middle" fontSize={13} style={sub}>
        {dict.drawing.forkliftPockets}
      </text>
      <HDim x1={0} x2={x(3)} y={W + 30} text="3.00" />
      <HDim x1={x(3)} x2={x(9)} y={W + 30} text="6.00" />
      <HDim x1={x(9)} x2={L} y={W + 30} text="3.00" />
      <HDim x1={0} x2={L} y={W + 66} text={`12.00 ${m}`} />
      <VDim x={-58} y1={0} y2={W} text={`3.60 ${m}`} />
      <VDim x={-24} y1={x(0.6)} y2={x(3.0)} text="2.40" />
      <text x={L} y={W + 90} textAnchor="end" fontSize={11} style={sub}>
        {dict.drawing.dimsInMetres}
      </text>
    </Svg>
  );
}

/** Page 5 — lifting point detail (schematic). */
export function LiftingPointDetail({ dict, className }: Props) {
  return (
    <Svg id="acc-lift" title={dict.drawing.liftingPoint} viewBox="0 0 560 300" className={className}>
      {/* skid beam flanges + web */}
      <rect x={110} y={70} width={360} height={16} style={{ fill: "var(--dw-wet)", stroke: "var(--dw-wall)", strokeWidth: 2 }} />
      <rect x={110} y={214} width={360} height={16} style={{ fill: "var(--dw-wet)", stroke: "var(--dw-wall)", strokeWidth: 2 }} />
      <rect x={272} y={86} width={36} height={128} style={{ fill: "var(--dw-wet)", stroke: "var(--dw-wall)", strokeWidth: 2 }} />
      {/* 4" pipe across the web */}
      <rect x={168} y={133} width={244} height={34} rx={6} style={{ fill: "var(--dw-accent-soft)", stroke: "var(--dw-accent)", strokeWidth: 2.4 }} />
      {/* MPI colour band */}
      <rect x={262} y={133} width={22} height={34} style={{ fill: "var(--dw-accent)", opacity: 0.55 }} />
      {[180, 400].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={150} r={24} style={{ fill: "var(--dw-paper)", stroke: "var(--dw-accent)", strokeWidth: 2.6 }} />
          <circle cx={cx} cy={150} r={12} style={stroke("var(--dw-wall)", 2)} />
        </g>
      ))}
      {/* callouts */}
      <g fontSize={13}>
        <line x1={150} y1={40} x2={240} y2={136} style={stroke("var(--dw-fixture)", 1.2)} />
        <text x={20} y={34} style={sub}>
          {dict.drawing.pipe}
        </text>
        <line x1={330} y1={50} x2={300} y2={72} style={stroke("var(--dw-fixture)", 1.2)} />
        <text x={330} y={44} style={sub}>
          {dict.drawing.skidBeam}
        </text>
        <line x1={160} y1={262} x2={268} y2={168} style={stroke("var(--dw-fixture)", 1.2)} />
        <text x={20} y={282} style={sub}>
          {dict.drawing.mpiBand}
        </text>
        <line x1={420} y1={262} x2={404} y2={176} style={stroke("var(--dw-fixture)", 1.2)} />
        <text x={540} y={282} textAnchor="end" style={sub}>
          {dict.drawing.serial}
        </text>
      </g>
    </Svg>
  );
}

/** Page 6 — floor framing. */
export function FloorFraming({ dict, locale, className }: Props) {
  const m = locale === "ar" ? "م" : "m";
  const L = 12 * S;
  const W = 3.6 * S;
  const joists: number[] = [];
  for (let v = 0.61; v < 12; v += 0.61) joists.push(v);
  return (
    <Svg id="acc-frame" title={dict.drawing.floorFraming} viewBox={`-70 -46 ${L + 100} ${W + 110}`} className={className}>
      <rect x={0} y={0} width={L} height={W} style={{ fill: "var(--dw-room)" }} />
      {joists.map((j) => (
        <line key={j} x1={j * S} y1={0} x2={j * S} y2={W} style={stroke("var(--dw-partition)", 1.2)} />
      ))}
      {[1.22, 2.44].map((y) => (
        <line key={y} x1={0} y1={y * S} x2={L} y2={y * S} style={stroke("var(--dw-wall)", 1.8)} />
      ))}
      <rect x={0} y={0} width={L} height={W} style={stroke("var(--dw-accent)", 3.2)} />
      <HDim x1={0} x2={0.61 * S} y={-16} text="0.61" size={12} />
      <HDim x1={0} x2={L} y={W + 34} text={`12.00 ${m}`} />
      <VDim x={-30} y1={0} y2={W} text={`3.60 ${m}`} />
    </Svg>
  );
}

/** Page 7 — wall / roof sandwich panel section. */
export function PanelSection({ dict, className }: Props) {
  return (
    <Svg id="acc-panel" title={dict.drawing.panelSection} viewBox="0 0 560 300" className={className}>
      <rect x={150} y={70} width={260} height={10} style={{ fill: "var(--dw-accent)" }} />
      <rect x={150} y={80} width={260} height={130} style={{ fill: "var(--dw-wet)", stroke: "var(--dw-partition)", strokeWidth: 1 }} />
      <rect x={150} y={210} width={260} height={10} style={{ fill: "var(--dw-accent)" }} />
      {/* foam texture */}
      {Array.from({ length: 22 }).map((_, i) => (
        <circle key={i} cx={165 + ((i * 37) % 230)} cy={95 + ((i * 53) % 100)} r={2.4} style={{ fill: "var(--dw-fixture)", opacity: 0.45 }} />
      ))}
      <line x1={380} y1={80} x2={380} y2={210} style={stroke("var(--dw-accent)", 1.6, { strokeDasharray: "6 5" })} />
      <text x={395} y={148} fontSize={11} textAnchor="middle" transform="rotate(-90 395 148)" style={{ ...sub, fill: "var(--dw-accent)" }}>
        {dict.drawing.uLock}
      </text>
      <VDim x={450} y1={70} y2={220} text="50 mm" size={13} />
      <g fontSize={13}>
        <line x1={120} y1={46} x2={200} y2={72} style={stroke("var(--dw-fixture)", 1.2)} />
        <text x={14} y={40} style={sub}>
          {dict.drawing.internalSkin}
        </text>
        <line x1={110} y1={145} x2={230} y2={145} style={stroke("var(--dw-fixture)", 1.2)} />
        <text x={14} y={140} style={sub}>
          {dict.drawing.puCore}
        </text>
        <line x1={120} y1={252} x2={200} y2={220} style={stroke("var(--dw-fixture)", 1.2)} />
        <text x={14} y={268} style={sub}>
          {dict.drawing.externalSkin}
        </text>
      </g>
      <text x={280} y={290} textAnchor="middle" fontSize={13} style={{ ...label, fill: "var(--dw-accent)" }}>
        {dict.drawing.uValue}
      </text>
    </Svg>
  );
}

/** Page 16 — berth arrangement per configuration (schematic). */
export function BerthSchematic({ beds, bunk, title, className }: { beds: number; bunk: boolean; title: string; className?: string }) {
  const count = bunk ? beds / 2 : beds;
  const bw = 34;
  const gap = 12;
  const total = count * bw + (count - 1) * gap;
  const x0 = (240 - total) / 2;
  const id = `berth-${beds}`;
  return (
    <Svg id={id} title={title} viewBox="0 0 240 130" className={className}>
      <rect x={20} y={14} width={200} height={102} rx={4} style={stroke("var(--dw-fixture)", 1.4, { strokeDasharray: "6 5" })} />
      {Array.from({ length: count }).map((_, i) => {
        const x = x0 + i * (bw + gap);
        return (
          <g key={i}>
            <rect x={x} y={30} width={bw} height={70} rx={3} style={{ fill: "var(--dw-wet)", stroke: "var(--dw-wall)", strokeWidth: 1.6 }} />
            <rect x={x + 5} y={36} width={bw - 10} height={12} rx={2} style={{ fill: "var(--dw-accent)", opacity: 0.8 }} />
            {bunk && (
              <text x={x + bw / 2} y={78} textAnchor="middle" fontSize={12} style={{ fill: "var(--dw-label)", fontWeight: 800 }}>
                ×2
              </text>
            )}
          </g>
        );
      })}
    </Svg>
  );
}
