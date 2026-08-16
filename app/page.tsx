"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CurveCanvas } from "@/components/CurveCanvas";
import { Recorder } from "@/components/Recorder";
import { FLAT, delta, describe, level, type Curve } from "@/lib/curve";
import { askFor, moveLabel } from "@/lib/prompts";
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

  const ask = useMemo(
    () => (match ? askFor(before, match.curve) : null),
    [before, match],
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
          move: ask?.move ?? "comfort",
          emoji: reply.emoji,
          caption: "",
          data: reply.data,
        });
        recordSent(match.id);
      }
      setStage("receive");
    },
    [ask, before, match],
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
            className="warm-btn rounded-full px-8 py-3.5 text-[15px] font-semibold transition-transform disabled:opacity-25"
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
          <div className="card w-full rounded-2xl p-4">
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
            className="warm-btn rounded-full px-8 py-3.5 text-[15px] font-semibold transition-transform"
          >
            Say something to them
          </button>
        </div>
      )}

      {stage === "give" && (
        <div className="rise flex w-full flex-col items-center gap-6 text-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] opacity-45">
              {ask?.move === "share" ? "Pass it on" : "Say it out loud"}
            </p>
            <h2 className="mt-2 text-[22px] leading-snug font-medium text-balance">
              {ask?.title}
            </h2>
            <p className="mt-2 text-sm opacity-55">{ask?.because}</p>
          </div>

          <Recorder onDone={sent} />

          <details className="w-full text-left">
            <summary className="cursor-pointer text-center text-xs opacity-45 hover:opacity-90">
              not sure what to say?
            </summary>
            <p className="card mt-3 rounded-2xl p-4 text-[15px] leading-relaxed opacity-80">
              {ask?.example}
            </p>
          </details>

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

          <div className="card w-full rounded-2xl p-6">
            <p className="mb-3 text-xs opacity-50">{moveLabel(match.move)}</p>
            <div className="pop mb-4 text-6xl">{match.emoji}</div>
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
              <p className="mt-3 text-[17px] leading-relaxed italic opacity-85">
                &ldquo;{match.caption}&rdquo;
              </p>
            )}
          </div>

          <button
            onClick={() => {
              setAfter(before);
              setStage("after");
            }}
            className="warm-btn rounded-full px-8 py-3.5 text-[15px] font-semibold transition-transform"
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
            className="warm-btn rounded-full px-8 py-3.5 text-[15px] font-semibold transition-transform"
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

      <div className="card w-full rounded-2xl p-4">
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
    <div className="rise flex flex-col items-center gap-7 text-center">
      <p className="text-[11px] uppercase tracking-[0.3em] opacity-40">Same Day</p>

      <div className="breathe">
        <svg viewBox="0 0 300 110" className="w-64" aria-hidden="true">
          <defs>
            <linearGradient id="lgrad" x1="0" x2="1">
              <stop offset="0%" stopColor="#e8705a" />
              <stop offset="45%" stopColor="#f4a259" />
              <stop offset="100%" stopColor="#7bc47f" />
            </linearGradient>
          </defs>
          <path
            d="M 20 78 C 55 78, 55 30, 90 30 S 125 88, 160 88 S 195 36, 230 36 S 268 62, 282 62"
            fill="none"
            stroke="url(#lgrad)"
            strokeWidth="4.5"
            strokeLinecap="round"
            pathLength={1}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: 1,
              animation: "draw 2.6s cubic-bezier(0.4, 0, 0.2, 1) 0.35s forwards",
            }}
          />
        </svg>
      </div>

      <h1 className="text-[32px] leading-[1.15] font-medium text-balance">
        Somebody had the exact{" "}
        <span
          style={{
            background: "linear-gradient(100deg, #e8705a, #f4a259)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          same day
        </span>{" "}
        as you.
      </h1>

      {/* What it does, before anyone has to press anything. */}
      <ol className="flex w-full max-w-[20rem] flex-col gap-2.5 text-left">
        {[
          ["✏️", "Draw your day", "five points, ten seconds, no words"],
          ["🫱", "Meet one person", "whose day had the same shape"],
          ["🎙️", "Say something real", "they hear it — then you hear theirs"],
        ].map(([icon, title, sub], i) => (
          <li
            key={title}
            className="card pop flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ animationDelay: `${0.5 + i * 0.13}s` }}
          >
            <span className="text-xl">{icon}</span>
            <span className="leading-tight">
              <strong className="text-[15px] font-medium">{title}</strong>
              <br />
              <span className="text-xs opacity-55">{sub}</span>
            </span>
          </li>
        ))}
      </ol>

      <button
        onClick={onStart}
        className="warm-btn rounded-full px-10 py-4 text-[16px] font-semibold transition-transform"
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

      <p className="text-xs opacity-40">no sign-up · no name · nothing leaves this device</p>
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
