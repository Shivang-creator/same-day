"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CurveCanvas } from "@/components/CurveCanvas";
import { Recorder } from "@/components/Recorder";
import { Waveform } from "@/components/Waveform";
import { FLAT, delta, describe, level, type Curve } from "@/lib/curve";
import { askFor, liftAsk, moveLabel } from "@/lib/prompts";
import {
  addClip,
  block,
  closeness,
  findMatch,
  forgetEverything,
  history,
  leaderboard,
  smile,
  recordSent,
  saveDay,
  smileCount,
  type Clip,
  type Day,
  type Ranked,
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
  const [board, setBoard] = useState<Ranked[]>([]);
  const [smiled, setSmiled] = useState(false);

  useEffect(() => {
    setSmiles(smileCount());
    setPast(history());
    setBoard(leaderboard());
  }, [stage]);

  const ask = useMemo(() => {
    if (!match) return null;
    // Every fourth exchange asks for a song instead of a sentence, so the app
    // never becomes relentlessly earnest.
    return smiles > 0 && smiles % 4 === 3 ? liftAsk() : askFor(before, match.curve);
  }, [before, match, smiles]);

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
            {match.audio && <Waveform src={match.audio} label="Their reply" />}
            {match.caption && (
              <p className="mt-3 text-[17px] leading-relaxed italic opacity-85">
                &ldquo;{match.caption}&rdquo;
              </p>
            )}
          </div>

          <button
            onClick={() => {
              smile(match.id);
              setSmiled(true);
            }}
            disabled={smiled}
            aria-label="This made me smile"
            className="grid h-16 w-16 place-items-center rounded-full text-3xl transition-transform active:scale-90 disabled:scale-100"
            style={{
              background: smiled ? "var(--warm)" : "var(--raise)",
              border: "1px solid var(--line)",
            }}
          >
            {smiled ? "😊" : "🙂"}
          </button>
          <p className="-mt-3 text-xs opacity-50">
            {smiled ? "they'll know it worked" : "did it work? tap the face"}
          </p>

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

      {stage === "result" && (
        <Result before={before} after={after} smiles={smiles} past={past} board={board} />
      )}
    </main>
  );
}

function Result({
  before,
  after,
  smiles,
  past,
  board,
}: {
  before: Curve;
  after: Curve;
  smiles: number;
  past: Day[];
  board: Ranked[];
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

      {board.length > 0 && (
        <div className="card w-full rounded-2xl p-4 text-left">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] opacity-45">
            Most smiled at
          </p>
          <ol className="flex flex-col gap-2.5">
            {board.map((r, i) => (
              <li key={r.clip.id} className="flex items-start gap-3">
                <span className="text-xs opacity-40 tabular-nums">{i + 1}</span>
                <span className="text-lg leading-none">{r.clip.emoji}</span>
                <span className="flex-1 text-[13px] leading-snug opacity-75">
                  {r.clip.caption}
                </span>
                <span className="text-xs whitespace-nowrap opacity-60">
                  {r.smiles} 🙂
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[11px] opacity-35">
            counted on this device — a shared board needs the server-side pool
          </p>
        </div>
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
    <div className="rise flex flex-col items-center gap-9 py-6 text-center">
      <p className="text-[11px] uppercase tracking-[0.35em] opacity-35">Same Day</p>

      {/* The curve sits on a tilted plane and draws itself once, slowly. It is
          the only thing moving on this screen, on purpose — the landing has to
          calm you down before it asks you for anything. */}
      <div style={{ perspective: "900px" }}>
        <div
          className="breathe"
          style={{ transform: "rotateX(38deg) rotateZ(-6deg)", transformStyle: "preserve-3d" }}
        >
          <svg viewBox="0 0 300 130" className="w-[17rem]" aria-hidden="true">
            <defs>
              <linearGradient id="lgrad" x1="0" x2="1">
                <stop offset="0%" stopColor="#e8705a" />
                <stop offset="45%" stopColor="#f4a259" />
                <stop offset="100%" stopColor="#7bc47f" />
              </linearGradient>
              <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f4a259" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f4a259" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M 20 78 C 55 78, 55 30, 90 30 S 125 88, 160 88 S 195 36, 230 36 S 268 62, 282 62 L 282 128 L 20 128 Z"
              fill="url(#fade)"
              style={{ opacity: 0, animation: "fadein 1.6s ease 2.2s forwards" }}
            />
            <path
              d="M 20 78 C 55 78, 55 30, 90 30 S 125 88, 160 88 S 195 36, 230 36 S 268 62, 282 62"
              fill="none"
              stroke="url(#lgrad)"
              strokeWidth="5"
              strokeLinecap="round"
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1,
                animation: "draw 3.2s cubic-bezier(0.35, 0, 0.2, 1) 0.5s forwards",
              }}
            />
          </svg>
        </div>
      </div>

      <h1 className="max-w-[16ch] text-[40px] leading-[1.08] font-medium tracking-[-0.02em] text-balance">
        Somebody had the{" "}
        <span
          style={{
            background: "linear-gradient(100deg, #e8705a, #f4a259 60%, #7bc47f)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          same day
        </span>{" "}
        as you.
      </h1>

      <p className="max-w-[22rem] text-[18px] leading-[1.6] opacity-60">
        Draw it. We&apos;ll find them. Then you get thirty seconds to make one stranger
        smile — and they get thirty to make you.
      </p>

      <button
        onClick={onStart}
        className="warm-btn rounded-full px-11 py-5 text-[17px] font-semibold transition-transform"
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
            className="text-[11px] underline decoration-dotted underline-offset-4 opacity-30 hover:opacity-80"
          >
            forget everything
          </button>
        </div>
      )}

      <ol className="flex w-full max-w-[21rem] flex-col gap-3" style={{ perspective: "800px" }}>
        {[
          ["\u270F\uFE0F", "Draw your day", "five points. no words, no mood list"],
          ["\uD83E\uDEF1", "Meet one person", "whose day had the same shape"],
          ["\uD83C\uDF99\uFE0F", "Say something real", "or sing it \u2014 badly is fine"],
        ].map(([icon, title, sub], i) => (
          <li
            key={title}
            className="card pop flex items-center gap-4 rounded-3xl px-5 py-4 text-left"
            style={{ animationDelay: `${1.1 + i * 0.18}s` }}
          >
            <span className="text-2xl">{icon}</span>
            <span className="leading-tight">
              <strong className="text-[17px] font-medium">{title}</strong>
              <br />
              <span className="text-[13px] opacity-50">{sub}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="flex max-w-[21rem] flex-col gap-1.5 text-[13px] opacity-45">
        <p>
          <strong className="font-medium opacity-90">Every voice here is a real person.</strong>{" "}
          Nothing on this site is AI-generated — not one clip, not one line of what anyone
          says to you.
        </p>
        <p className="text-xs opacity-70">no sign-up · no name · nothing leaves this device</p>
      </div>
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
