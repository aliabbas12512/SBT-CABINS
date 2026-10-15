import type { CSSProperties } from "react";
import type { Locale } from "@/i18n/config";

/**
 * Axonometric dimension diagram — overall length, width and height only.
 * It intentionally shows no doors or windows: their exact positions are
 * defined in the floor plan, so the diagram cannot misrepresent them.
 */
export function DimensionDiagram({
  length,
  width,
  height,
  locale,
  title,
  className,
}: {
  length: number;
  width: number;
  height: number;
  locale: Locale;
  title: string;
  className?: string;
}) {
  const S = 100;
  const dx = width * 0.5 * Math.cos(Math.PI / 6);
  const dy = width * 0.5 * Math.sin(Math.PI / 6);
  const L = length;
  const H = height;
  const m = locale === "ar" ? "م" : "m";
  const font = Math.max(22, L * 3.1);

  const p = (x: number, y: number) => `${x * S},${y * S}`;
  // Front face sits with its top-left at (0, dy) so the top face fits above.
  const y0 = dy;
  const front = [p(0, y0), p(L, y0), p(L, y0 + H), p(0, y0 + H)].join(" ");
  const top = [p(0, y0), p(L, y0), p(L + dx, y0 - dy), p(dx, y0 - dy)].join(" ");
  const side = [p(L, y0), p(L + dx, y0 - dy), p(L + dx, y0 - dy + H), p(L, y0 + H)].join(" ");

  const ribs: number[] = [];
  for (let x = 0.25; x < L - 0.1; x += 0.25) ribs.push(x);

  const line = (w: number, extra: CSSProperties = {}): CSSProperties => ({ stroke: "var(--dw-dim)", strokeWidth: w, fill: "none", ...extra });
  const pad = { l: 1.0, r: 0.5 + dx, t: 0.5, b: 1.15 };

  return (
    <svg
      viewBox={`${-pad.l * S} ${-pad.t * S} ${(L + pad.l + pad.r) * S} ${(H + dy + pad.t + pad.b) * S}`}
      className={className}
      role="img"
      aria-label={title}
      direction="ltr"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <title>{title}</title>
      <polygon points={top} style={{ fill: "var(--dw-wet)", stroke: "var(--dw-wall)", strokeWidth: 3, strokeLinejoin: "round" }} />
      <polygon points={side} style={{ fill: "var(--dw-wet)", stroke: "var(--dw-wall)", strokeWidth: 3, strokeLinejoin: "round" }} />
      <polygon points={front} style={{ fill: "var(--dw-room)", stroke: "var(--dw-wall)", strokeWidth: 3.5, strokeLinejoin: "round" }} />
      {ribs.map((x) => (
        <line key={x} x1={x * S} y1={y0 * S + 4} x2={x * S} y2={(y0 + H) * S - 4} style={{ stroke: "var(--dw-fixture)", strokeWidth: 0.8, opacity: 0.55 }} />
      ))}

      {/* Length */}
      <g>
        <line x1={0} y1={(y0 + H + 0.55) * S} x2={L * S} y2={(y0 + H + 0.55) * S} style={line(2)} />
        <line x1={0} y1={(y0 + H + 0.1) * S} x2={0} y2={(y0 + H + 0.7) * S} style={line(1.2)} />
        <line x1={L * S} y1={(y0 + H + 0.1) * S} x2={L * S} y2={(y0 + H + 0.7) * S} style={line(1.2)} />
        <text x={(L / 2) * S} y={(y0 + H + 0.45) * S} textAnchor="middle" fontSize={font} style={{ fill: "var(--dw-label)", fontWeight: 800 }}>
          {L.toFixed(2)} {m}
        </text>
      </g>
      {/* Height */}
      <g>
        <line x1={-0.5 * S} y1={y0 * S} x2={-0.5 * S} y2={(y0 + H) * S} style={line(2)} />
        <line x1={-0.7 * S} y1={y0 * S} x2={-0.1 * S} y2={y0 * S} style={line(1.2)} />
        <line x1={-0.7 * S} y1={(y0 + H) * S} x2={-0.1 * S} y2={(y0 + H) * S} style={line(1.2)} />
        <text
          x={-0.62 * S}
          y={(y0 + H / 2) * S}
          textAnchor="middle"
          fontSize={font}
          transform={`rotate(-90 ${-0.62 * S} ${(y0 + H / 2) * S})`}
          style={{ fill: "var(--dw-label)", fontWeight: 800 }}
        >
          {H.toFixed(2)} {m}
        </text>
      </g>
      {/* Width (depth) */}
      <g>
        <line x1={(L + 0.35) * S} y1={(y0 + H) * S} x2={(L + 0.35 + dx) * S} y2={(y0 + H - dy) * S} style={line(2)} />
        <text
          x={(L + 0.45 + dx / 2) * S}
          y={(y0 + H - dy / 2 + 0.35) * S}
          textAnchor="start"
          fontSize={font}
          style={{ fill: "var(--dw-label)", fontWeight: 800 }}
        >
          {width.toFixed(2)} {m}
        </text>
      </g>
    </svg>
  );
}
