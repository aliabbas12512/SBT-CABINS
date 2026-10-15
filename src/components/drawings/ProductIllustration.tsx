import type { ReactNode } from "react";

/**
 * Presentation illustrations for products that have no supplied photograph
 * (containers and portable toilets). Oblique 3-D views generated from the
 * product's length and width. Heights, colours and details are illustrative;
 * every use on the site is captioned "Illustration — not a photograph".
 */

export type IllustrationKind = "containerOffice" | "containerStorage" | "toiletFibre" | "toiletLgs" | "toiletBlock";

type Props = {
  kind: IllustrationKind;
  length: number;
  width: number;
  /** Entrance door on the visible end wall instead of the front (12 × 4 m block). */
  endDoor?: boolean;
  /** Roof water-tank radius in metres (toilets). */
  tankRadius?: number;
  title: string;
  className?: string;
};

const S = 60; // px per metre
const K = 0.55; // depth foreshortening
const TH = (32 * Math.PI) / 180;

type Pt = [number, number];

export function ProductIllustration({ kind, length: L, width: W, endDoor, tankRadius = 0.45, title, className }: Props) {
  const isToilet = kind.startsWith("toilet");
  const H = kind === "toiletFibre" || kind === "toiletLgs" ? 2.3 : isToilet ? 2.6 : 2.9;
  const dx = Math.cos(TH) * K;
  const dy = Math.sin(TH) * K;

  const P = (x: number, y: number, z: number): Pt => [(x + y * dx) * S, (-z - y * dy) * S];
  const poly = (pts: Pt[]) => pts.map((p) => p.join(",")).join(" ");
  const front = (x0: number, z0: number, x1: number, z1: number) => poly([P(x0, 0, z0), P(x1, 0, z0), P(x1, 0, z1), P(x0, 0, z1)]);
  const end = (y0: number, z0: number, y1: number, z1: number) => poly([P(L, y0, z0), P(L, y1, z0), P(L, y1, z1), P(L, y0, z1)]);

  const palette = (() => {
    switch (kind) {
      case "containerStorage":
        return { face: "#3d618a", rib: "#31527a", end: "#2b4769", top: "#4a6f97", frame: "#1f3450", trim: "#16263c" };
      case "toiletFibre":
        return { face: "#eef3f9", rib: "#dfe7f1", end: "#cfdbe9", top: "#f7fafd", frame: "#1f4e8c", trim: "#173a69" };
      case "toiletLgs":
        return { face: "#f1f3f6", rib: "#e0e5ec", end: "#cdd5df", top: "#f7f9fb", frame: "#3a4656", trim: "#262f3b" };
      case "toiletBlock":
        return { face: "#f2f4f7", rib: "#e2e7ee", end: "#ced6e0", top: "#f8fafc", frame: "#3a4656", trim: "#262f3b" };
      default:
        return { face: "#f4f6f9", rib: "#e3e8ef", end: "#d3dbe6", top: "#eef2f7", frame: "#3b4a5e", trim: "#2a3647" };
    }
  })();

  const els: ReactNode[] = [];
  const k = (() => {
    let i = 0;
    return () => `e${i++}`;
  })();

  // Ground shadow
  els.push(
    <polygon
      key={k()}
      points={poly([P(-0.3, -0.25, 0), P(L + 0.4, -0.25, 0), P(L + 0.4, W + 0.6, 0), P(-0.3, W + 0.6, 0)])}
      style={{ fill: "var(--il-shadow)" }}
    />,
  );

  // Base skid
  const base = 0.18;
  els.push(<polygon key={k()} points={front(0, 0, L, base)} style={{ fill: palette.trim }} />);
  els.push(<polygon key={k()} points={end(0, 0, W, base)} style={{ fill: palette.trim, opacity: 0.85 }} />);

  // Faces
  els.push(<polygon key={k()} points={front(0, base, L, H)} style={{ fill: palette.face }} />);
  els.push(<polygon key={k()} points={end(0, base, W, H)} style={{ fill: palette.end }} />);
  els.push(<polygon key={k()} points={poly([P(0, 0, H), P(L, 0, H), P(L, W, H), P(0, W, H)])} style={{ fill: palette.top }} />);

  // Ribs / corrugation
  const ribStep = kind === "containerStorage" || kind === "containerOffice" ? 0.3 : 0.25;
  for (let x = 0.2; x < L - 0.15; x += ribStep) {
    els.push(<polygon key={k()} points={front(x, base + 0.12, x + ribStep / 2, H - 0.14)} style={{ fill: palette.rib }} />);
  }
  for (let y = 0.2; y < W - 0.15; y += ribStep) {
    const a = P(L, y, base + 0.12);
    const b = P(L, y, H - 0.14);
    els.push(<line key={k()} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} style={{ stroke: "rgb(0 0 0 / 0.08)", strokeWidth: 3 }} />);
  }

  // Frame: rails and corner posts
  const fr = isToilet ? 0.1 : 0.14;
  els.push(<polygon key={k()} points={front(0, H - fr, L, H)} style={{ fill: palette.frame }} />);
  els.push(<polygon key={k()} points={end(0, H - fr, W, H)} style={{ fill: palette.frame }} />);
  els.push(<polygon key={k()} points={front(0, base, L, base + fr)} style={{ fill: palette.frame }} />);
  els.push(<polygon key={k()} points={end(0, base, W, base + fr)} style={{ fill: palette.frame }} />);
  els.push(<polygon key={k()} points={front(0, base, fr, H)} style={{ fill: palette.frame }} />);
  els.push(<polygon key={k()} points={front(L - fr, base, L, H)} style={{ fill: palette.frame }} />);
  els.push(<polygon key={k()} points={end(W - fr, base, W, H)} style={{ fill: palette.frame }} />);
  if (!isToilet) {
    for (const [x, z] of [
      [0, H - 0.18],
      [L - 0.18, H - 0.18],
      [0, base],
      [L - 0.18, base],
    ] as Pt[]) {
      els.push(<polygon key={k()} points={front(x, z, x + 0.18, z + 0.18)} style={{ fill: palette.trim }} />);
    }
  }

  const windowFront = (x0: number, x1: number, z0: number, z1: number) => {
    els.push(<polygon key={k()} points={front(x0 - 0.06, z0 - 0.06, x1 + 0.06, z1 + 0.06)} style={{ fill: "#ffffff" }} />);
    els.push(<polygon key={k()} points={front(x0, z0, x1, z1)} style={{ fill: "#8fa8c3" }} />);
    els.push(
      <polygon
        key={k()}
        points={poly([P(x0 + (x1 - x0) * 0.15, 0, z0), P(x0 + (x1 - x0) * 0.45, 0, z0), P(x0 + (x1 - x0) * 0.85, 0, z1), P(x0 + (x1 - x0) * 0.55, 0, z1)])}
        style={{ fill: "#ffffff", opacity: 0.35 }}
      />,
    );
    const m = (x0 + x1) / 2;
    const a = P(m, 0, z0);
    const b = P(m, 0, z1);
    els.push(<line key={k()} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} style={{ stroke: "#ffffff", strokeWidth: 3 }} />);
  };

  const doorFront = (x0: number, x1: number, color: string, louvre = false) => {
    const z1 = Math.min(2.1, H - 0.3);
    els.push(<polygon key={k()} points={front(x0 - 0.05, base, x1 + 0.05, z1 + 0.05)} style={{ fill: "#ffffff" }} />);
    els.push(<polygon key={k()} points={front(x0, base, x1, z1)} style={{ fill: color }} />);
    const h = P(x1 - 0.12, 0, 1.05);
    els.push(<rect key={k()} x={h[0] - 3} y={h[1] - 9} width={6} height={18} rx={2} style={{ fill: "#d9dee6" }} />);
    if (louvre) {
      for (let z = 0.35; z < 0.75; z += 0.1) {
        const a = P(x0 + 0.15, 0, z);
        const b = P(x1 - 0.15, 0, z);
        els.push(<line key={k()} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} style={{ stroke: "rgb(255 255 255 / 0.35)", strokeWidth: 2.5 }} />);
      }
    }
    // Lamp above the door
    const l = P((x0 + x1) / 2, 0, z1 + 0.22);
    els.push(<circle key={k()} cx={l[0]} cy={l[1]} r={6} style={{ fill: "#fbfdff", stroke: "#c3cbd6", strokeWidth: 1.5 }} />);
  };

  const doorEnd = (y0: number, y1: number, color: string) => {
    const z1 = Math.min(2.1, H - 0.3);
    els.push(<polygon key={k()} points={end(y0 - 0.05, base, y1 + 0.05, z1 + 0.05)} style={{ fill: "#ffffff" }} />);
    els.push(<polygon key={k()} points={end(y0, base, y1, z1)} style={{ fill: color }} />);
  };

  const vent = (x0: number, x1: number) => {
    els.push(<polygon key={k()} points={front(x0, H - 0.55, x1, H - 0.3)} style={{ fill: "#c9d3df" }} />);
    for (let z = H - 0.5; z < H - 0.32; z += 0.06) {
      const a = P(x0 + 0.03, 0, z);
      const b = P(x1 - 0.03, 0, z);
      els.push(<line key={k()} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} style={{ stroke: "#7d8a9b", strokeWidth: 1.6 }} />);
    }
  };

  const roofTank = (cx: number, cy: number, r: number, h: number) => {
    const c0 = P(cx, cy, H);
    const c1 = P(cx, cy, H + h);
    const rx = r * S;
    const ry = r * S * 0.42;
    els.push(<ellipse key={k()} cx={c0[0]} cy={c0[1]} rx={rx} ry={ry} style={{ fill: "#11161f" }} />);
    els.push(<rect key={k()} x={c0[0] - rx} y={c1[1]} width={rx * 2} height={c0[1] - c1[1]} style={{ fill: "#1d2430" }} />);
    els.push(<rect key={k()} x={c0[0] - rx * 0.55} y={c1[1]} width={rx * 0.3} height={c0[1] - c1[1]} style={{ fill: "#ffffff", opacity: 0.08 }} />);
    for (const f of [0.33, 0.66]) {
      const yy = c1[1] + (c0[1] - c1[1]) * f;
      els.push(<line key={k()} x1={c0[0] - rx} y1={yy} x2={c0[0] + rx} y2={yy} style={{ stroke: "#0b0f15", strokeWidth: 2 }} />);
    }
    els.push(<ellipse key={k()} cx={c1[0]} cy={c1[1]} rx={rx} ry={ry} style={{ fill: "#2a3240" }} />);
    els.push(<ellipse key={k()} cx={c1[0]} cy={c1[1]} rx={rx * 0.28} ry={ry * 0.28} style={{ fill: "#11161f" }} />);
  };

  // Product-specific details
  if (kind === "containerOffice") {
    const doorX = L >= 10 ? 5.57 : 0.62;
    const wins = L >= 10 ? [[1.3, 2.3], [3.4, 4.4], [7.6, 8.6], [9.7, 10.7]] : [[2.5, 3.5], [4.35, 5.35]];
    wins.forEach(([a, b]) => windowFront(a, b, 1.05, 2.0));
    doorFront(doorX, doorX + 0.88, "#2a2e35");
    // Steel step
    els.push(<polygon key={k()} points={poly([P(doorX - 0.1, -0.45, 0.2), P(doorX + 0.98, -0.45, 0.2), P(doorX + 0.98, 0, 0.2), P(doorX - 0.1, 0, 0.2)])} style={{ fill: "#6b7686" }} />);
    els.push(<polygon key={k()} points={front(doorX - 0.1, 0, doorX + 0.98, 0.2)} style={{ fill: "#4b5563" }} />);
    // Split AC outdoor unit on the end wall
    els.push(<polygon key={k()} points={end(W * 0.25, 1.55, W * 0.6, 2.2)} style={{ fill: "#e9edf2", stroke: "#aab4c1", strokeWidth: 1.5 }} />);
    const f = P(L, W * 0.42, 1.88);
    els.push(<ellipse key={k()} cx={f[0]} cy={f[1]} rx={9} ry={14} style={{ fill: "#9aa6b5" }} />);
  }

  if (kind === "containerStorage") {
    // Double end doors with locking bars
    const mid = W / 2;
    els.push(<polygon key={k()} points={end(0.16, base + 0.16, W - 0.16, H - 0.18)} style={{ fill: "#2f4f74" }} />);
    const s = P(L, mid, base + 0.16);
    const t = P(L, mid, H - 0.18);
    els.push(<line key={k()} x1={s[0]} y1={s[1]} x2={t[0]} y2={t[1]} style={{ stroke: palette.trim, strokeWidth: 3 }} />);
    for (const y of [0.55, mid - 0.35, mid + 0.35, W - 0.55]) {
      const a = P(L, y, base + 0.1);
      const b = P(L, y, H - 0.12);
      els.push(<line key={k()} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} style={{ stroke: "#c7d1dd", strokeWidth: 3.5 }} />);
      const h = P(L, y + 0.12, 1.2);
      els.push(<line key={k()} x1={a[0]} y1={(a[1] + b[1]) / 2} x2={h[0]} y2={h[1]} style={{ stroke: "#c7d1dd", strokeWidth: 3 }} />);
    }
  }

  if (kind === "toiletFibre" || kind === "toiletLgs") {
    doorFront(0.3, 1.2, kind === "toiletFibre" ? "#2c63b0" : "#30363f", true);
    vent(0.35, 1.15);
    roofTank(L * 0.55, W * 0.5, tankRadius, 0.75);
    if (kind === "toiletFibre") {
      // Moulded roof cap
      els.push(<polygon key={k()} points={poly([P(-0.05, -0.05, H), P(L + 0.05, -0.05, H), P(L + 0.05, -0.05, H + 0.08), P(-0.05, -0.05, H + 0.08)])} style={{ fill: palette.frame }} />);
    }
  }

  if (kind === "toiletBlock") {
    const ventCount = Math.max(2, Math.floor(L / 1.2));
    const gap = L / ventCount;
    for (let i = 0; i < ventCount; i++) {
      const x0 = i * gap + gap * 0.25;
      if (!endDoor && x0 < 1.4) continue;
      vent(x0, x0 + gap * 0.5);
    }
    if (endDoor) doorEnd(W / 2 - 0.45, W / 2 + 0.45, "#30363f");
    else doorFront(0.32, 1.2, "#30363f", true);
    // WC sign
    const sg = endDoor ? P(L, W / 2 + 0.75, 1.75) : P(1.45, 0, 1.75);
    els.push(<rect key={k()} x={sg[0] - 14} y={sg[1] - 10} width={28} height={20} rx={3} style={{ fill: "#1f4e8c" }} />);
    els.push(
      <text key={k()} x={sg[0]} y={sg[1] + 5} textAnchor="middle" fontSize={12} style={{ fill: "#ffffff", fontWeight: 800, fontFamily: "Manrope, sans-serif" }}>
        WC
      </text>,
    );
    roofTank(L * 0.62, W * 0.5, tankRadius, tankRadius * 1.5);
  }

  // Bounds
  const tankTop = isToilet ? tankRadius * (kind === "toiletBlock" ? 1.5 : 1) + 0.9 : 0;
  const minX = -0.6 * S;
  const maxX = (L + W * dx + 0.7) * S;
  const minY = -(H + W * dy + tankTop + 0.4) * S;
  const maxY = 0.55 * S;
  return (
    <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} className={className} role="img" aria-label={title} preserveAspectRatio="xMidYMid meet">
      <title>{title}</title>
      {els}
    </svg>
  );
}
