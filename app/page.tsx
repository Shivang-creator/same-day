"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CurveCanvas } from "@/components/CurveCanvas";
import { Recorder } from "@/components/Recorder";
import { FLAT, delta, describe, level, type Curve } from "@/lib/curve";
import { PROMPTS } from "@/lib/seeds";
import {
  addClip,
  block,
  closeness,
  findMatch,
  forgetEverything,
  history,
  recordSent,
  saveDay,
  smileCount,
  type Clip,
  type Day,
} from "@/lib/pool";

type Stage = "intro" | "draw" | "match" | "give" | "receive" | "after" | "result";

export default function Page() {
  const [stage, setStage] = useState<Stage>("intro");
  const [before, setBefore] = useState<Curve>(FLAT);
  const [after, setAfter] = useState<Curve>(FLAT);
  const [match, setMatch] = useState<Clip | null>(null);
  const [smiles, setSmiles] = useState(0);
  const [touched, setTouched] = useState(false);
  const [past, setPast] = useState<Day[]>([]);

  useEffect(() => {
    setSmiles(smileCount());
    setPast(history());
  }, [stage]);

  const prompt = useMemo(
    () => PROMPTS[Math.floor(level(before) * PROMPTS.length) % PROMPTS.length],
    [before],
  );

  const toMatch = useCallback(() => {
    setMatch(findMatch(before));
    setStage("match");
  }, [before]);

  const sent = useCallback(
    (reply: { data?: string; emoji: string }) => {
      if (match) {
        addClip({
          id: `me-${Date.now()}`,
          curve: before,
          prompt,
          emoji: reply.emoji,
          data: reply.data,
        });
        recordSent(match.id);
      }
      setStage("receive");
    },
    [before, match, prompt],
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-7 px-5 py-10">
      {stage === "intro" && <Landing onStart={() => setStage("draw")} past={past} />}

      {stage === "draw" && (
        <div className="rise flex w-full flex-col items-center gap-5">
          <div className="text-center">
            <h2 className="text-xl font-medium">How did today actually go?</h2>
            <p className="mt-1.5 text-sm opacity-60">
              Drag the five points. No words — naming it is the hard part.
            </p>
          </div>
          <CurveCanvas
            curve={before}
            onChange={(c) => {
              setBefore(c);
              setTouched(true);
            }}
          />
          <p className="h-5 text-sm opacity-55">{touched ? describe(before) : ""}</p>
          <button
            disabled={!touched}
            onClick={toMatch}
            className="rounded-full bg-[var(--ink)] px-8 py-3.5 text-[15px] font-medium text-[var(--ground)] transition-transform active:scale-95 disabled:opacity-25"
          >
            {touched ? "Find my person" : "Move a point to start"}
          </button>
        </div>
      )}

      {stage === "match" && match && (
        <div className="rise flex w-full flex-col items-center gap-5 text-center">
          <p className="text-xs uppercase tracking-[0.2em] opacity-45">Found someone</p>
          <h2 className="text-xl leading-snug font-medium text-balance">
            They had {closeness(before, match.curve)}.
          </h2>
          <div className="w-full rounded-2xl bg-[var(--raise)] p-4">
            <CurveCanvas curve={match.curve} ghost={before} readOnly label="Their day" />
            <p className="mt-2 text-xs opacity-55">
              theirs solid · yours dotted — {describe(match.curve)}
            </p>
          </div>
          <p className="max-w-[19rem] text-[15px] leading-relaxed opacity-70">
            You go first. It works better that way — giving lifts you more than receiving does.
          </p>
          <button
            onClick={() => setStage("give")}
            className="rounded-full bg-[var(--ink)] px-8 py-3.5 text-[15px] font-medium text-[var(--ground)] transition-transform active:scale-95"
          >
            Say something to them
          </button>
        </div>
      )}

      {stage === "give" && (
        <div className="rise flex w-full flex-col items-center gap-6 text-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] opacity-45">Your ten seconds</p>
            <h2 className="mt-2 text-xl leading-snug font-medium text-balance">{prompt}</h2>
          </div>
          <Recorder onDone={sent} />
          <p className="max-w-[19rem] text-xs leading-relaxed opacity-45">
            They&apos;ll never know who you are. You&apos;ll never know who they are. That&apos;s
            the whole deal.
          </p>
        </div>
      )}

      {stage === "receive" && match && (
        <div className="rise flex w-full flex-col items-center gap-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] opacity-45">Sent · now yours</p>
          <h2 className="text-xl leading-snug font-medium text-balance">
            Someone who had your day said this.
          </h2>

          <div className="w-full rounded-2xl bg-[var(--raise)] p-6">
            <p className="mb-3 text-xs opacity-50">they were asked: {match.prompt.toLowerCase()}</p>
            <div className="mb-4 text-5xl">{match.emoji}</div>
            {match.audio && (
              <audio
                src={match.audio}
                controls
                autoPlay
                className="w-full"
                aria-label="Their ten-second reply"
              />
            )}
            {match.caption && (
              <p className="mt-3 text-[15px] leading-relaxed italic opacity-80">
                &ldquo;{match.caption}&rdquo;
              </p>
            )}
          </div>

          <button
            onClick={() => {
              setAfter(before);
              setStage("after");
            }}
            className="rounded-full bg-[var(--ink)] px-8 py-3.5 text-[15px] font-medium text-[var(--ground)] transition-transform active:scale-95"
          >
            Okay — ask me again
          </button>

          {/* One tap out. No live channel and no text field means this is the
              whole attack surface — so the exit has to be immediate. */}
          <button
            onClick={() => {
              block(match.id);
              const next = findMatch(before, [match.id]);
              if (next) setMatch(next);
              else setStage("after");
            }}
            className="text-xs underline decoration-dotted underline-offset-4 opacity-40 hover:opacity-90"
          >
            that wasn&apos;t okay — skip it and don&apos;t send it to anyone else
          </button>
        </div>
      )}

      {stage === "after" && (
        <div className="rise flex w-full flex-col items-center gap-5">
          <div className="text-center">
            <h2 className="text-xl font-medium">Now — how&apos;s today?</h2>
            <p className="mt-1.5 text-sm opacity-60">Same five points. Move them or leave them.</p>
          </div>
          <CurveCanvas curve={after} onChange={setAfter} ghost={before} />
          <p className="text-xs opacity-45">dotted line is where you were before</p>
          <button
            onClick={() => {
              saveDay({ at: Date.now(), before, after });
              setStage("result");
            }}
            className="rounded-full bg-[var(--ink)] px-8 py-3.5 text-[15px] font-medium text-[var(--ground)] transition-transform active:scale-95"
          >
            Show me
          </button>
        </div>
      )}

      {stage === "result" && <Result before={before} after={after} smiles={smiles} past={past} />}
    </main>
  );
}

function Result({
  before,
  after,
  smiles,
  past,
}: {
  before: Curve;
  after: Curve;
  smiles: number;
  past: Day[];
}) {
  const d = delta(before, after);
  const pts = Math.round(d * 100);

  // This is allowed to be flat or negative. A tool that can only report
  // improvement isn't measuring anything — it's just agreeing with itself.
  const headline =
    pts > 2
      ? `Your day is ${pts} points brighter than it was four minutes ago.`
      : pts < -2
        ? "It went down. That's real, and it's worth knowing too."
        : "About the same — and that's an honest answer.";

  return (
    <div className="rise flex w-full flex-col items-center gap-6 text-center">
      <p className="text-xs uppercase tracking-[0.2em] opacity-45">Before · after</p>
      <h2 className="text-xl leading-snug font-medium text-balance">{headline}</h2>

      <div className="w-full rounded-2xl bg-[var(--raise)] p-4">
        <CurveCanvas curve={after} ghost={before} readOnly label="Your day, before and after" />
        <div className="mt-3 flex items-center justify-center gap-6 text-sm">
          <span className="opacity-50">before {Math.round(level(before) * 100)}</span>
          <span className="text-lg font-medium" style={{ color: "var(--warm)" }}>
            {pts >= 0 ? "+" : ""}
            {pts}
          </span>
          <span className="opacity-50">after {Math.round(level(after) * 100)}</span>
        </div>
      </div>

      <p className="max-w-[20rem] text-[15px] leading-relaxed opacity-70">
        Every other app asks if you feel better. This one measured it, on your own drawing, and
        it prints the number even when the number is bad.
      </p>

      {smiles > 0 && (
        <p className="text-sm">
          <span className="text-2xl">🙂</span>
          <br />
          You&apos;ve made <strong>{smiles}</strong> {smiles === 1 ? "person" : "people"} smile.
          <br />
          <span className="text-xs opacity-45">this only ever goes up — it never resets</span>
        </p>
      )}

      <button
        onClick={() => window.location.reload()}
        className="rounded-full border border-[var(--line)] px-6 py-3 text-sm opacity-70 transition-opacity hover:opacity-100"
      >
        Again tomorrow
      </button>
    </div>
  );
}

/**
 * The opening screen.
 *
 * A curve draws itself once, unprompted, so the first thing you see is the
 * gesture the app is asking for rather than a paragraph explaining it. One
 * button. No scrolling, no marketing.
 */
function Landing({ onStart, past }: { onStart: () => void; past: Day[] }) {
  return (
    <div className="rise flex flex-col items-center gap-6 text-center">
      <p className="text-xs uppercase tracking-[0.25em] opacity-40">Same Day</p>

      <svg viewBox="0 0 300 96" className="w-56" aria-hidden="true">
        <path
          d="M 20 70 C 55 70, 55 26, 90 26 S 125 78, 160 78 S 195 34, 230 34 S 265 58, 280 58"
          fill="none"
          stroke="var(--warm)"
          strokeWidth="3.5"
          strokeLinecap="round"
          pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: 1,
            animation: "draw 2.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards",
          }}
        />
      </svg>

      <h1 className="text-[30px] leading-[1.2] font-medium text-balance">
        Somebody had the exact same day as you.
      </h1>

      <p className="max-w-[19rem] text-[15px] leading-relaxed opacity-65">
        Draw yours in ten seconds. We&apos;ll find them. You get one shot at making them
        smile — then you hear what they said to you.
      </p>

      <button
        onClick={onStart}
        className="rounded-full bg-[var(--ink)] px-9 py-4 text-[15px] font-medium text-[var(--ground)] transition-transform active:scale-95"
      >
        {past.length > 0 ? "Draw today" : "Draw my day"}
      </button>

      {past.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <HistoryStrip past={past} />
          <button
            onClick={() => {
              forgetEverything();
              window.location.reload();
            }}
            className="text-[11px] underline decoration-dotted underline-offset-4 opacity-35 hover:opacity-80"
          >
            forget everything
          </button>
        </div>
      )}

      <p className="text-xs opacity-40">
        no sign-up · no name · nothing leaves this device
      </p>
    </div>
  );
}

/** Your last fortnight, one bar per day: where you started, where you ended. */
function HistoryStrip({ past }: { past: Day[] }) {
  const days = past.slice(-14);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-end gap-1" role="img" aria-label={`Your last ${days.length} days`}>
        {days.map((d, i) => {
          const b = level(d.before);
          const a = level(d.after);
          return (
            <div key={i} className="flex w-2.5 flex-col items-center justify-end" style={{ height: 34 }}>
              <div
                className="w-full rounded-full"
                style={{
                  height: `${Math.max(8, a * 100)}%`,
                  background: a >= b ? "var(--warm)" : "var(--line)",
                }}
                title={`${a >= b ? "+" : ""}${Math.round((a - b) * 100)}`}
              />
            </div>
          );
        })}
      </div>
      <p className="text-[11px] opacity-40">
        your last {days.length} {days.length === 1 ? "day" : "days"} · coral means it lifted
      </p>
    </div>
  );
}
