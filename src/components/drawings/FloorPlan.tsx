import type { CSSProperties, ReactNode } from "react";
import type { Door, FloorPlanData, Fixture, Pt, Seg } from "@/data/plans";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Re-drawn floor plan. Geometry comes from `src/data/plans.ts` (metres).
 * Colours come from the active edition's drawing palette (--dw-* tokens),
 * so the same verified geometry renders as navy-on-white in the light
 * edition and blue-and-white-on-midnight in the dark edition.
 */

const S = 100; // 1 m = 100 user units
const WALL = 0.14;
const PART = 0.07;

const c = (v: string): CSSProperties => ({ fill: v });
const st = (v: string, w: number, extra: CSSProperties = {}): CSSProperties => ({
  stroke: v,
  strokeWidth: w * S,
  fill: "none",
  ...extra,
});

function windowShape(seg: Seg, L: number, W: number, key: number) {
  const [x1, y1] = seg.a;
  const [x2, y2] = seg.b;
  const horizontal = Math.abs(y1 - y2) < 1e-6;
  let rx: number, ry: number, rw: number, rh: number;
  if (horizontal) {
    rx = Math.min(x1, x2);
    rw = Math.abs(x2 - x1);
    ry = y1 <= 0.01 ? 0 : W - WALL;
    rh = WALL;
  } else {
    ry = Math.min(y1, y2);
    rh = Math.abs(y2 - y1);
    rx = x1 <= 0.01 ? 0 : L - WALL;
    rw = WALL;
  }
  const lines = horizontal
    ? [ry + WALL * 0.38, ry + WALL * 0.62].map((y) => ({ x1: rx, y1: y, x2: rx + rw, y2: y }))
    : [rx + WALL * 0.38, rx + WALL * 0.62].map((x) => ({ x1: x, y1: ry, x2: x, y2: ry + rh }));
  return (
    <g key={`w${key}`}>
      <rect x={rx * S} y={ry * S} width={rw * S} height={rh * S} style={{ fill: "var(--dw-paper)", stroke: "var(--dw-wall)", strokeWidth: 1.2 }} />
      {lines.map((l, i) => (
        <line key={i} x1={l.x1 * S} y1={l.y1 * S} x2={l.x2 * S} y2={l.y2 * S} style={st("var(--dw-window)", 0.02)} />
      ))}
    </g>
  );
}

function doorShape(d: Door, L: number, W: number, key: number) {
  const [hx, hy] = d.hinge;
  const tip: Pt = [hx + d.open[0] * d.width, hy + d.open[1] * d.width];
  const end: Pt = [hx + d.closed[0] * d.width, hy + d.closed[1] * d.width];
  // Sweep direction: sign of the cross product of (open × closed)
  const cross = d.open[0] * d.closed[1] - d.open[1] * d.closed[0];
  const sweep = cross > 0 ? 1 : 0;

  // Opening in an external wall: cut the wall with a gap rectangle
  let gap: ReactNode = null;
  const onFront = Math.abs(hy - (W - WALL)) < 0.05 || Math.abs(hy - W) < 0.05;
  const onRear = hy < 0.2 && d.closed[1] === 0;
  if ((onFront || onRear) && d.closed[1] === 0) {
    const x0 = Math.min(hx, end[0]);
    const y0 = onFront ? W - WALL : 0;
    gap = (
      <g>
        <rect x={x0 * S} y={y0 * S - 0.5} width={d.width * S} height={WALL * S + 1} style={c("var(--dw-door-gap)")} />
        <line x1={x0 * S} y1={(y0 + (onFront ? WALL : 0)) * S} x2={(x0 + d.width) * S} y2={(y0 + (onFront ? WALL : 0)) * S} style={st("var(--dw-fixture)", 0.012)} />
      </g>
    );
  }
  const sideWall = (Math.abs(hx) < 0.2 || Math.abs(hx - L) < 0.2) && d.closed[0] === 0;
  if (sideWall) {
    const y0 = Math.min(hy, end[1]);
    const x0 = hx < 0.2 ? 0 : L - WALL;
    gap = <rect x={x0 * S - 0.5} y={y0 * S} width={WALL * S + 1} height={d.width * S} style={c("var(--dw-door-gap)")} />;
  }

  return (
    <g key={`d${key}`}>
      {gap}
      <line x1={hx * S} y1={hy * S} x2={tip[0] * S} y2={tip[1] * S} style={st("var(--dw-wall)", 0.035, { strokeLinecap: "round" })} />
      <path
        d={`M ${tip[0] * S} ${tip[1] * S} A ${d.width * S} ${d.width * S} 0 0 ${sweep} ${end[0] * S} ${end[1] * S}`}
        style={st("var(--dw-wall)", 0.012, { strokeDasharray: "4 3.5" })}
      />
    </g>
  );
}

function fixtureShape(f: Fixture, key: number) {
  const fx = st("var(--dw-fixture)", 0.012);
  const fill = { fill: "var(--dw-fixture-fill)" };
  switch (f.kind) {
    case "bed": {
      const { x, y, w, h } = f.r;
      const pw = 0.36;
      const px = f.pillow === "left" ? x + 0.08 : x + w - 0.08 - pw;
      const sheet = f.pillow === "left" ? x + 0.75 : x + w - 0.75;
      return (
        <g key={key}>
          <rect x={x * S} y={y * S} width={w * S} height={h * S} style={{ ...fx, ...fill }} />
          <rect x={px * S} y={(y + 0.1) * S} width={pw * S} height={(h - 0.2) * S} rx={4} style={fx} />
          <line x1={sheet * S} y1={y * S} x2={sheet * S} y2={(y + h) * S} style={fx} />
        </g>
      );
    }
    case "wardrobe": {
      const { x, y, w, h } = f.r;
      return (
        <g key={key}>
          <rect x={x * S} y={y * S} width={w * S} height={h * S} style={{ ...fx, ...fill }} />
          <line x1={(w > h ? x : x + w) * S} y1={(w > h ? y + h : y) * S} x2={(w > h ? x + w : x) * S} y2={(w > h ? y : y + h) * S} style={fx} />
        </g>
      );
    }
    case "desk": {
      const { x, y, w, h } = f.r;
      return (
        <g key={key}>
          <rect x={x * S} y={y * S} width={w * S} height={h * S} style={{ ...fx, ...fill }} />
          <line x1={(x + w * 0.3) * S} y1={(y + 0.1) * S} x2={(x + w * 0.7) * S} y2={(y + 0.1) * S} style={st("var(--dw-fixture)", 0.02)} />
        </g>
      );
    }
    case "chair":
      return (
        <rect
          key={key}
          x={(f.c[0] - f.size / 2) * S}
          y={(f.c[1] - f.size / 2) * S}
          width={f.size * S}
          height={f.size * 0.92 * S}
          rx={8}
          style={{ ...fx, ...fill }}
        />
      );
    case "stool":
      return <circle key={key} cx={f.c[0] * S} cy={f.c[1] * S} r={f.radius * S} style={{ ...fx, ...fill }} />;
    case "wc":
      return (
        <g key={key}>
          <rect x={f.tank.x * S} y={f.tank.y * S} width={f.tank.w * S} height={f.tank.h * S} style={{ ...fx, ...fill }} />
          <ellipse cx={f.bowl[0] * S} cy={f.bowl[1] * S} rx={0.18 * S} ry={0.26 * S} style={{ ...fx, ...fill }} />
        </g>
      );
    case "basin": {
      const { x, y, w, h } = f.r;
      return (
        <g key={key}>
          <rect x={x * S} y={y * S} width={w * S} height={h * S} style={{ ...fx, ...fill }} />
          <ellipse cx={(x + w / 2) * S} cy={(y + h / 2) * S} rx={w * 0.34 * S} ry={h * 0.3 * S} style={fx} />
        </g>
      );
    }
    case "counter": {
      const { x, y, w, h } = f.r;
      return (
        <g key={key}>
          <rect x={x * S} y={y * S} width={w * S} height={h * S} style={{ ...fx, ...fill }} />
          {f.sink && (
            <>
              <rect x={f.sink.x * S} y={f.sink.y * S} width={f.sink.w * S} height={f.sink.h * S} style={fx} />
              <circle cx={(f.sink.x + f.sink.w / 2) * S} cy={(f.sink.y + f.sink.h / 2) * S} r={3.5} style={c("var(--dw-fixture)")} />
            </>
          )}
        </g>
      );
    }
    case "cabinet": {
      const { x, y, w, h } = f.r;
      return (
        <g key={key}>
          <rect x={x * S} y={y * S} width={w * S} height={h * S} style={{ ...fx, ...fill }} />
          {f.split === "h" ? (
            <line x1={x * S} y1={(y + h / 2) * S} x2={(x + w) * S} y2={(y + h / 2) * S} style={fx} />
          ) : (
            <line x1={(x + w / 2) * S} y1={y * S} x2={(x + w / 2) * S} y2={(y + h) * S} style={fx} />
          )}
        </g>
      );
    }
  }
}

function Tick({ x, y }: { x: number; y: number }) {
  return <line x1={x - 7} y1={y + 7} x2={x + 7} y2={y - 7} style={st("var(--dw-dim)", 0.018)} />;
}

export function FloorPlan({
  plan,
  locale,
  dict,
  title,
  className,
}: {
  plan: FloorPlanData;
  locale: Locale;
  dict: Dictionary;
  title: string;
  className?: string;
}) {
  const L = plan.length;
  const W = plan.width;
  const padL = 0.85;
  const padR = 0.35;
  const padT = 0.85;
  const padB = plan.segments ? 1.55 : 1.15;
  const vbW = (L + padL + padR) * S;
  const vbH = (W + padT + padB) * S;
  const fs = Math.max(13, Math.min(L, 12) * 1.55); // label font size (user units)
  const lgFont = L <= 4 ? 22 : L <= 6 ? 24 : 26;
  const smFont = L <= 6 ? 15 : 17;
  const roomName = (key: string, index?: number) => {
    const base = dict.drawing[key as keyof Dictionary["drawing"]] as string;
    return index ? `${base} ${index}` : base;
  };
  const m = locale === "ar" ? "م" : "m";
  const m2 = locale === "ar" ? "م²" : "m²";

  return (
    <svg
      viewBox={`${-padL * S} ${-padT * S} ${vbW} ${vbH}`}
      className={className}
      role="img"
      aria-label={title}
      direction="ltr"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <title>{title}</title>

      {/* Outer shell: wall ring + room fill */}
      <rect x={0} y={0} width={L * S} height={W * S} style={c("var(--dw-wall)")} />
      <rect x={WALL * S} y={WALL * S} width={(L - 2 * WALL) * S} height={(W - 2 * WALL) * S} style={c("var(--dw-paper)")} />
      <rect x={WALL * S} y={WALL * S} width={(L - 2 * WALL) * S} height={(W - 2 * WALL) * S} style={c("var(--dw-room)")} />

      {/* Wet areas */}
      {plan.wet.map((r, i) => {
        const x = Math.max(r.x, WALL);
        const y = Math.max(r.y, WALL);
        const x2 = Math.min(r.x + r.w, L - WALL);
        const y2 = Math.min(r.y + r.h, W - WALL);
        return <rect key={i} x={x * S} y={y * S} width={(x2 - x) * S} height={(y2 - y) * S} style={c("var(--dw-wet)")} />;
      })}

      {/* Fixtures */}
      {plan.fixtures.map((f, i) => fixtureShape(f, i))}

      {/* Partitions */}
      {plan.partitions.map((p, i) => (
        <line key={i} x1={p.a[0] * S} y1={p.a[1] * S} x2={p.b[0] * S} y2={p.b[1] * S} style={st("var(--dw-partition)", PART, { strokeLinecap: "square" })} />
      ))}

      {/* Windows and doors */}
      {plan.windows.map((w, i) => windowShape(w, L, W, i))}
      {plan.doors.map((d, i) => doorShape(d, L, W, i))}

      {/* Room labels */}
      {plan.rooms.map((r, i) => (
        <g key={i} textAnchor="middle">
          <text
            x={r.at[0] * S}
            y={r.at[1] * S}
            style={{ fill: "var(--dw-label)", fontWeight: 800, letterSpacing: locale === "ar" ? 0 : 1.5 }}
            fontSize={r.size === "sm" ? smFont : lgFont}
          >
            {roomName(r.key, r.index)}
          </text>
          <text
            x={r.at[0] * S}
            y={r.at[1] * S + (r.size === "sm" ? 20 : 30)}
            style={{ fill: "var(--dw-sublabel)", fontWeight: 500 }}
            fontSize={r.size === "sm" ? smFont * 0.82 : lgFont * 0.72}
            className="num"
          >
            ≈ {r.area.toFixed(1)} {m2}
          </text>
        </g>
      ))}

      {/* Overall length (top) */}
      <g>
        <line x1={0} y1={-0.45 * S} x2={L * S} y2={-0.45 * S} style={st("var(--dw-dim)", 0.014)} />
        <line x1={0} y1={-0.6 * S} x2={0} y2={-0.06 * S} style={st("var(--dw-dim)", 0.01)} />
        <line x1={L * S} y1={-0.6 * S} x2={L * S} y2={-0.06 * S} style={st("var(--dw-dim)", 0.01)} />
        <Tick x={0} y={-0.45 * S} />
        <Tick x={L * S} y={-0.45 * S} />
        <text x={(L / 2) * S} y={-0.55 * S} textAnchor="middle" fontSize={fs + 6} style={{ fill: "var(--dw-label)", fontWeight: 800 }}>
          {L.toFixed(2)} {m}
        </text>
      </g>

      {/* Overall width (left) */}
      <g>
        <line x1={-0.45 * S} y1={0} x2={-0.45 * S} y2={W * S} style={st("var(--dw-dim)", 0.014)} />
        <line x1={-0.6 * S} y1={0} x2={-0.06 * S} y2={0} style={st("var(--dw-dim)", 0.01)} />
        <line x1={-0.6 * S} y1={W * S} x2={-0.06 * S} y2={W * S} style={st("var(--dw-dim)", 0.01)} />
        <Tick x={-0.45 * S} y={0} />
        <Tick x={-0.45 * S} y={W * S} />
        <text
          x={-0.58 * S}
          y={(W / 2) * S}
          textAnchor="middle"
          fontSize={fs + 6}
          transform={`rotate(-90 ${-0.58 * S} ${(W / 2) * S})`}
          style={{ fill: "var(--dw-label)", fontWeight: 800 }}
        >
          {W.toFixed(2)} {m}
        </text>
      </g>

      {/* Segment dimensions (bottom) */}
      {plan.segments && (
        <g>
          {(() => {
            const y = (W + 0.5) * S;
            let acc = 0;
            const marks = [0, ...plan.segments.map((s) => (acc += s))];
            return (
              <>
                <line x1={0} y1={y} x2={L * S} y2={y} style={st("var(--dw-dim)", 0.014)} />
                {marks.map((mx, i) => (
                  <g key={i}>
                    <line x1={mx * S} y1={(W + 0.08) * S} x2={mx * S} y2={y + 10} style={st("var(--dw-dim)", 0.01)} />
                    <Tick x={mx * S} y={y} />
                  </g>
                ))}
                {plan.segments!.map((s, i) => (
                  <text key={i} x={(marks[i] + s / 2) * S} y={y - 9} textAnchor="middle" fontSize={fs + 2} style={{ fill: "var(--dw-sublabel)", fontWeight: 700 }}>
                    {s.toFixed(2)}
                  </text>
                ))}
              </>
            );
          })()}
        </g>
      )}

      {/* Front marker */}
      <g transform={`translate(${(L / 2) * S} ${(W + (plan.segments ? 0.92 : 0.5)) * S})`}>
        <path d="M -12 10 L 0 -8 L 12 10 Z" style={c("var(--dw-label)")} />
        <text y={36} textAnchor="middle" fontSize={fs + 2} style={{ fill: "var(--dw-label)", fontWeight: 800, letterSpacing: locale === "ar" ? 0 : 4 }}>
          {dict.drawing.front}
        </text>
      </g>
    </svg>
  );
}
