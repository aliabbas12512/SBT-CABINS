"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { fillText, getDesignerDict } from "@/i18n/designer";
import { EXTRA_GROUPS, EXTRA_LABELS, type DesignerSettings, type RoomUse, type SpaceKind } from "@/lib/designer/config";
import { moveSpace, removeSpace, setExtra, updateSpace, type Design } from "@/lib/designer/design";
import type { DesignAction } from "@/lib/designer/actions";
import { IconX } from "@/components/ui/Icons";

const btn = "inline-flex min-h-[38px] items-center justify-center rounded-full border border-line bg-bg px-3 text-xs font-semibold text-ink transition hover:border-accent hover:text-accent disabled:opacity-40";

function DimInput({ label, value, min, max, onCommit, id }: { label: string; value: number; min: number; max: number; onCommit: (v: number) => void; id: string }) {
  const [text, setText] = useState(String(value));
  const [prev, setPrev] = useState(value);
  // Follow outside changes (chat, presets) — derived state, no effect needed.
  if (prev !== value) {
    setPrev(value);
    setText(String(value));
  }
  const commit = () => {
    const v = Number(text.replace(",", "."));
    if (Number.isFinite(v) && v >= min && v <= max) onCommit(Math.round(v * 100) / 100);
    else setText(String(value));
  };
  return (
    <label className="block text-xs" htmlFor={id}>
      <span className="text-muted">{label}</span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step={0.05}
        min={min}
        max={max}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className="num mt-1 block min-h-[40px] w-full rounded-xl border border-line bg-bg px-3 text-base text-ink focus:border-accent focus:outline-none sm:text-sm"
        data-testid={id}
      />
    </label>
  );
}

export function DesignerControls({
  design,
  settings,
  locale,
  onChange,
  onAction,
  onQuote,
  canQuote,
}: {
  design: Design;
  settings: DesignerSettings;
  locale: Locale;
  onChange: (d: Design) => void;
  onAction: (a: DesignAction[]) => void;
  onQuote: () => void;
  canQuote: boolean;
}) {
  const t = getDesignerDict(locale);
  const c = t.controls;
  const R = settings.rules;
  const rooms = design.spaces.filter((s) => s.kind === "room").length;
  const add = (kind: SpaceKind) => onAction([{ op: "add", kind }]);

  return (
    <div className="space-y-5" data-testid="designer-controls">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-1.5" data-testid="quick-actions">
        <button type="button" className={btn} onClick={() => add("room")}>
          + {c.addRoom}
        </button>
        <button type="button" className={btn} onClick={() => onAction([{ op: "remove", kind: "room" }])} disabled={!rooms}>
          − {c.removeRoom}
        </button>
        <button type="button" className={btn} onClick={() => add("toilet")}>
          + {c.addToilet}
        </button>
        <button type="button" className={btn} onClick={() => add("bathroom")}>
          + {c.addBathroom}
        </button>
        <button type="button" className={btn} onClick={() => add("toiletBath")}>
          + {c.addToiletBath}
        </button>
        <button type="button" className={btn} onClick={() => add("kitchenette")}>
          + {c.addKitchenette}
        </button>
        <button type="button" className={btn} onClick={() => add("storage")}>
          + {c.addStorage}
        </button>
        <button type="button" className={btn} onClick={() => document.getElementById("dim-length")?.focus()}>
          {c.changeDims}
        </button>
        <button type="button" className={btn} onClick={() => onAction([{ op: "reset" }])} data-testid="reset">
          {c.reset}
        </button>
        <button type="button" className="btn-primary !min-h-[38px] !px-4 !py-1 text-xs disabled:opacity-50" onClick={onQuote} disabled={!canQuote}>
          {c.quote}
        </button>
      </div>

      {/* Category */}
      <fieldset>
        <legend className="text-xs font-semibold text-muted">{c.category}</legend>
        <div className="mt-1.5 inline-flex rounded-full border border-line p-1" role="radiogroup">
          {(["normal", "aramco"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={design.category === v}
              onClick={() => onAction([{ op: "category", value: v }])}
              className={`min-h-[36px] rounded-full px-4 text-xs font-semibold ${design.category === v ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"}`}
              data-testid={`category-${v}`}
            >
              {v === "normal" ? c.normal : c.aramco}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Dimensions */}
      <fieldset>
        <legend className="text-xs font-semibold text-muted">{c.size}</legend>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          <DimInput id="dim-length" label={c.length} value={design.length} min={R.minLength} max={R.maxLength} onCommit={(v) => onAction([{ op: "size", length: v }])} />
          <DimInput id="dim-width" label={c.width} value={design.width} min={R.minWidth} max={R.maxWidth} onCommit={(v) => onAction([{ op: "size", width: v }])} />
          <DimInput id="dim-height" label={c.height} value={design.height} min={R.minHeight} max={R.maxHeight} onCommit={(v) => onAction([{ op: "size", height: v }])} />
        </div>
        <p className="mt-1 text-[0.68rem] text-muted">
          {fillText(c.dimsHint, { minL: R.minLength, maxL: R.maxLength, minW: R.minWidth, maxW: R.maxWidth, minH: R.minHeight, maxH: R.maxHeight })}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[0.68rem] text-muted">{c.presets}:</span>
          {R.presets.map((p) => (
            <button
              key={`${p.length}x${p.width}`}
              type="button"
              onClick={() => onAction([{ op: "size", length: p.length, width: p.width }])}
              className={`num min-h-[30px] rounded-full px-2.5 text-[0.7rem] font-semibold ring-1 ${design.length === p.length && design.width === p.width ? "bg-accent/10 text-accent ring-accent/40" : "text-ink ring-line hover:ring-accent"}`}
            >
              {p.length} × {p.width}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Spaces */}
      <fieldset>
        <legend className="text-xs font-semibold text-muted">{c.layout}</legend>
        <ol className="mt-1.5 space-y-1.5" data-testid="space-list">
          {design.spaces.map((s, i) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs" data-kind={s.kind}>
              <span className="num w-5 text-muted">{i + 1}.</span>
              <span className="min-w-0 flex-1 font-semibold text-ink">{c.kinds[s.kind]}</span>
              {s.kind === "room" && (
                <select
                  aria-label={c.use}
                  value={s.use ?? "bedroom"}
                  onChange={(e) => onChange(updateSpace(design, s.id, { use: e.target.value as RoomUse }))}
                  className="min-h-[32px] rounded-lg border border-line bg-surface px-1.5 text-xs text-ink"
                >
                  {(["bedroom", "office", "living"] as const).map((u) => (
                    <option key={u} value={u}>
                      {c.uses[u]}
                    </option>
                  ))}
                </select>
              )}
              <span className="flex items-center gap-0.5">
                <button type="button" aria-label={c.moveLeft} disabled={i === 0} onClick={() => onChange(moveSpace(design, s.id, -1))} className="h-8 w-8 rounded-full text-muted hover:bg-surface-2 disabled:opacity-30">
                  ‹
                </button>
                <button
                  type="button"
                  aria-label={c.moveRight}
                  disabled={i === design.spaces.length - 1}
                  onClick={() => onChange(moveSpace(design, s.id, 1))}
                  className="h-8 w-8 rounded-full text-muted hover:bg-surface-2 disabled:opacity-30"
                >
                  ›
                </button>
                <button type="button" aria-label={`${c.remove} ${c.kinds[s.kind]}`} onClick={() => onChange(removeSpace(design, { id: s.id }))} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
                  <IconX width={14} height={14} />
                </button>
              </span>
            </li>
          ))}
        </ol>
      </fieldset>

      {/* Windows, furniture, quantity */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="block text-xs">
          <span className="text-muted">{c.windows}</span>
          <select
            value={design.windowsPerRoom}
            onChange={(e) => onAction([{ op: "windows", perRoom: e.target.value === "2" ? 2 : 1 }])}
            className="mt-1 block min-h-[40px] w-full rounded-xl border border-line bg-bg px-2 text-sm text-ink"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </label>
        <label className="block text-xs">
          <span className="text-muted">{c.quantity}</span>
          <input
            type="number"
            min={1}
            max={500}
            value={design.quantity}
            onChange={(e) => onAction([{ op: "quantity", n: Number(e.target.value) || 1 }])}
            className="num mt-1 block min-h-[40px] w-full rounded-xl border border-line bg-bg px-3 text-base text-ink sm:text-sm"
            data-testid="quantity"
          />
        </label>
        <label className="col-span-2 flex min-h-[40px] items-center gap-2 text-xs sm:col-span-1 sm:mt-5">
          <input
            type="checkbox"
            checked={design.spaces.some((s) => s.furnished !== false)}
            onChange={(e) => onAction([{ op: "furnished", value: e.target.checked }])}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          {c.furnished}
        </label>
      </div>

      {/* Extras */}
      <details className="rounded-xl border border-line bg-bg p-3">
        <summary className="cursor-pointer text-xs font-semibold text-ink">{c.extras}</summary>
        <div className="mt-3 space-y-3">
          {EXTRA_GROUPS.map((g) => (
            <div key={g.title.en}>
              <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted">{g.title[locale]}</p>
              <ul className="mt-1 space-y-1">
                {g.ids.map((id) => {
                  const q = design.extras[id] ?? 0;
                  return (
                    <li key={id} className="flex items-center justify-between gap-2 text-xs">
                      <span>{EXTRA_LABELS[id][locale]}</span>
                      <span className="flex items-center gap-1">
                        <button type="button" aria-label={`− ${EXTRA_LABELS[id][locale]}`} disabled={!q} onClick={() => onChange(setExtra(design, id, q - 1))} className="h-8 w-8 rounded-full border border-line disabled:opacity-30">
                          −
                        </button>
                        <span className="num w-6 text-center font-semibold" data-testid={`extra-${id}`}>
                          {q}
                        </span>
                        <button type="button" aria-label={`+ ${EXTRA_LABELS[id][locale]}`} onClick={() => onChange(setExtra(design, id, q + 1))} className="h-8 w-8 rounded-full border border-line">
                          +
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
