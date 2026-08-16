"use client";

import { useCallback, useRef, useState } from "react";
import { POINTS, SLOT_LABELS, colorAt, type Curve } from "@/lib/curve";

const W = 320;
const H = 180;
const PAD_X = 26;
const PAD_Y = 22;

function xFor(i: number) {
  return PAD_X + (i * (W - PAD_X * 2)) / (POINTS - 1);
}
function yFor(v: number) {
  return H - PAD_Y - v * (H - PAD_Y * 2);
}
function valueFor(y: number) {
  const v = (H - PAD_Y - y) / (H - PAD_Y * 2);
  return Math.max(0, Math.min(1, v));
}

/** A smooth path through the five points, so a day reads as a curve not a zigzag. */
function pathFor(curve: Curve): string {
  const pts = curve.map((v, i) => [xFor(i), yFor(v)] as const);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const mx = (x0 + x1) / 2;
    d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

export function CurveCanvas({
  curve,
  onChange,
  readOnly = false,
  ghost,
  label,
}: {
  curve: Curve;
  onChange?: (c: Curve) => void;
  readOnly?: boolean;
  /** A second curve drawn faintly underneath — used to show "before". */
  ghost?: Curve;
  label?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  const setPoint = useCallback(
    (i: number, clientY: number) => {
      if (readOnly || !onChange) return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const y = ((clientY - rect.top) / rect.height) * H;
      const next = [...curve];
      next[i] = Math.round(valueFor(y) * 100) / 100;
      onChange(next);
    },
    [curve, onChange, readOnly],
  );

  const move = useCallback(
    (e: React.PointerEvent) => {
      if (dragging === null) return;
      e.preventDefault();
      setPoint(dragging, e.clientY);
    },
    [dragging, setPoint],
  );

  const nudge = useCallback(
    (i: number, dir: number) => {
      if (readOnly || !onChange) return;
      const next = [...curve];
      next[i] = Math.max(0, Math.min(1, Math.round((next[i] + dir * 0.1) * 100) / 100));
      onChange(next);
    },
    [curve, onChange, readOnly],
  );

  return (
    <div className="w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        role="group"
        aria-label={label ?? "The shape of your day, five points from morning to night"}
        onPointerMove={move}
        onPointerUp={() => setDragging(null)}
        onPointerLeave={() => setDragging(null)}
      >
        <defs>
          <linearGradient id="curveGrad" x1="0" x2="1" y1="0" y2="0">
            {curve.map((v, i) => (
              <stop key={i} offset={`${(i / (POINTS - 1)) * 100}%`} stopColor={colorAt(v)} />
            ))}
          </linearGradient>
        </defs>

        {/* the midline — "an ordinary day" */}
        <line
          x1={PAD_X - 8}
          x2={W - PAD_X + 8}
          y1={yFor(0.5)}
          y2={yFor(0.5)}
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeDasharray="2 5"
        />

        {ghost && (
          <path
            d={pathFor(ghost)}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.22}
            strokeWidth={2}
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
        )}

        <path
          d={pathFor(curve)}
          fill="none"
          stroke="url(#curveGrad)"
          strokeWidth={3.5}
          strokeLinecap="round"
        />

        {curve.map((v, i) => (
          <g key={i}>
            {!readOnly && (
              // a generous invisible target — thumbs are not 6px wide
              <rect
                x={xFor(i) - 22}
                y={0}
                width={44}
                height={H}
                fill="transparent"
                className="cursor-ns-resize"
                onPointerDown={(e) => {
                  (e.target as Element).setPointerCapture?.(e.pointerId);
                  setDragging(i);
                  setPoint(i, e.clientY);
                }}
              />
            )}
            <circle
              cx={xFor(i)}
              cy={yFor(v)}
              r={dragging === i ? 8 : 6}
              fill={colorAt(v)}
              stroke="var(--ground)"
              strokeWidth={2.5}
              className="pointer-events-none transition-[r] duration-100"
            />
          </g>
        ))}
      </svg>

      {!readOnly && (
        <div className="mt-1 flex justify-between px-1">
          {SLOT_LABELS.map((slot, i) => (
            <div key={slot} className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] uppercase tracking-wider opacity-45">{slot}</span>
              {/* keyboard path — the drag is not the only way in */}
              <div className="flex gap-0.5">
                <button
                  type="button"
                  onClick={() => nudge(i, 1)}
                  aria-label={`Make ${slot} brighter`}
                  className="rounded px-1 text-[10px] opacity-40 hover:opacity-100 focus-visible:opacity-100"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => nudge(i, -1)}
                  aria-label={`Make ${slot} heavier`}
                  className="rounded px-1 text-[10px] opacity-40 hover:opacity-100 focus-visible:opacity-100"
                >
                  ▼
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
