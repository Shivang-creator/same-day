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
  recordSent,
  saveDay,
  smile,
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
    // every fourth one asks you to sing instead, so it never gets too earnest
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

  if (stage === "intro") return <Landing onStart={() => setStage("draw")} past={past} />;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center gap-7 px-6 py-12 lg:max-w-2xl">
      {stage === "draw" && (
        <div className="rise flex w-full flex-col items-center gap-6">
          <div className="text-center">
            <h2 className="display text-3xl lg:text-4xl">how did today actually go?</h2>
            <p className="mt-2 text-[15px] opacity-55">
              drag the five points. no words, no mood list.
            </p>
          </div>
          <div className="w-full max-w-lg">
            <CurveCanvas
              curve={before}
              onChange={(c) => {
                setBefore(c);
                setTouched(true);
              }}
            />
          </div>
          <p className="h-5 text-sm opacity-55">{touched ? describe(before) : ""}</p>
          <button
            disabled={!touched}
            onClick={toMatch}
            className="warm-btn rounded-full px-9 py-4 text-[15px] font-semibold transition-transform disabled:opacity-25"
          >
            {touched ? "find my person" : "move a point first"}
          </button>
        </div>
      )}

      {stage === "match" && match && (
        <div className="rise flex w-full flex-col items-center gap-6 text-center">
          <p className="text-[11px] tracking-[0.25em] uppercase opacity-40">found someone</p>
          <h2 className="display max-w-[18ch] text-3xl lg:text-4xl">
            they had {closeness(before, match.curve)}
          </h2>
          <div className="card w-full max-w-lg rounded-3xl p-5">
            <CurveCanvas curve={match.curve} ghost={before} readOnly label="Their day" />
            <p className="mt-2 text-xs opacity-50">
              theirs solid, yours dotted. {describe(match.curve)}
            </p>
          </div>
          <p className="max-w-[24rem] text-[15px] leading-relaxed opacity-65">
            you go first. giving lifts you more than getting does, so that&apos;s the order.
          </p>
          <button
            onClick={() => setStage("give")}
            className="warm-btn rounded-full px-9 py-4 text-[15px] font-semibold transition-transform"
          >
            say something to them
          </button>
        </div>
      )}

      {stage === "give" && (
        <div className="rise flex w-full flex-col items-center gap-7 text-center">
          <div>
            <p className="text-[11px] tracking-[0.25em] uppercase opacity-40">
              {ask?.move === "share" ? "pass it on" : ask?.move === "lift" ? "sing it" : "say it"}
            </p>
            <h2 className="display mt-3 max-w-[20ch] text-3xl lg:text-[34px]">{ask?.title}</h2>
            <p className="mt-3 text-sm opacity-55">{ask?.because}</p>
          </div>

          <Recorder onDone={sent} />

          <details className="w-full max-w-md text-left">
            <summary className="cursor-pointer text-center text-xs opacity-40 hover:opacity-90">
              stuck? here&apos;s one
            </summary>
            <p className="card mt-3 rounded-2xl p-4 text-[15px] leading-relaxed opacity-80">
              {ask?.example}
            </p>
          </details>

          <p className="max-w-[22rem] text-xs leading-relaxed opacity-40">
            they never find out who you are. you never find out who they are.
          </p>
        </div>
      )}

      {stage === "receive" && match && (
        <div className="rise flex w-full flex-col items-center gap-6 text-center">
          <p className="text-[11px] tracking-[0.25em] uppercase opacity-40">sent. now yours</p>
          <h2 className="display max-w-[18ch] text-3xl lg:text-4xl">
            someone who had your day said this
          </h2>

          <div className="card w-full max-w-lg rounded-3xl p-6">
            <p className="mb-4 text-xs opacity-45">{moveLabel(match.move)}</p>
            <div className="pop mb-5 text-6xl">{match.emoji}</div>
            {match.audio && <Waveform src={match.audio} label="Their reply" />}
            {match.caption && (
              <p className="display mt-4 text-xl leading-snug opacity-90">
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
            className="grid h-16 w-16 place-items-center rounded-full text-3xl transition-transform active:scale-90"
            style={{
              background: smiled ? "var(--c2)" : "var(--raise)",
              border: "1px solid var(--line)",
            }}
          >
            {smiled ? "😊" : "🙂"}
          </button>
          <p className="-mt-3 text-xs opacity-50">
            {smiled ? "they'll know it landed" : "did it work? tap the face"}
          </p>

          <button
            onClick={() => {
              setAfter(before);
              setStage("after");
            }}
            className="warm-btn rounded-full px-9 py-4 text-[15px] font-semibold transition-transform"
          >
            ok, ask me again
          </button>

          {/* one tap out. no live channel and no text box anywhere, so a clip
              someone opted into hearing is the whole attack surface. */}
          <button
            onClick={() => {
              block(match.id);
              const next = findMatch(before, [match.id]);
              if (next) setMatch(next);
              else setStage("after");
            }}
            className="text-xs underline decoration-dotted underline-offset-4 opacity-35 hover:opacity-90"
          >
            that wasn&apos;t okay. pull it
          </button>
        </div>
      )}

      {stage === "after" && (
        <div className="rise flex w-full flex-col items-center gap-6">
          <div className="text-center">
            <h2 className="display text-3xl lg:text-4xl">so how&apos;s today now?</h2>
            <p className="mt-2 text-[15px] opacity-55">same five points. move them or don&apos;t.</p>
          </div>
          <div className="w-full max-w-lg">
            <CurveCanvas curve={after} onChange={setAfter} ghost={before} />
          </div>
          <p className="text-xs opacity-40">dotted is where you were before</p>
          <button
            onClick={() => {
              saveDay({ at: Date.now(), before, after });
              setStage("result");
            }}
            className="warm-btn rounded-full px-9 py-4 text-[15px] font-semibold transition-transform"
          >
            show me
          </button>
        </div>
      )}

      {stage === "result" && (
        <Result before={before} after={after} smiles={smiles} past={past} board={board} />
      )}
    </main>
  );
}

function Landing({ onStart, past }: { onStart: () => void; past: Day[] }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-center px-6 py-12">
      <div className="rise grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* left: the pitch */}
        <div className="flex flex-col items-center gap-7 text-center lg:items-start lg:text-left">
          <p className="text-[11px] tracking-[0.35em] uppercase opacity-35">same day</p>

          <h1 className="display max-w-[14ch] text-[46px] leading-[1.02] sm:text-[58px] lg:text-[64px]">
            somebody had the{" "}
            <span
              style={{
                background: "linear-gradient(100deg, var(--c1), var(--c2) 50%, var(--c3))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              same day
            </span>{" "}
            as you.
          </h1>

          <p className="max-w-[26rem] text-[19px] leading-[1.6] opacity-60">
            draw it, and we&apos;ll find them. you get thirty seconds to make one stranger
            smile. they get thirty to make you.
          </p>

          <button
            onClick={onStart}
            className="warm-btn rounded-full px-12 py-5 text-[17px] font-semibold transition-transform"
          >
            {past.length > 0 ? "draw today" : "draw my day"}
          </button>

          {past.length > 0 && (
            <div className="flex flex-col items-center gap-2 lg:items-start">
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
        </div>

        {/* right: the curve, then what actually happens */}
        <div className="flex flex-col items-center gap-8">
          <div style={{ perspective: "1000px" }}>
            <div
              className="breathe"
              style={{ transform: "rotateX(34deg) rotateZ(-7deg)", transformStyle: "preserve-3d" }}
            >
              <svg viewBox="0 0 300 130" className="w-[19rem] lg:w-[24rem]" aria-hidden="true">
                <defs>
                  <linearGradient id="lgrad" x1="0" x2="1">
                    <stop offset="0%" stopColor="var(--c1)" />
                    <stop offset="52%" stopColor="var(--c2)" />
                    <stop offset="100%" stopColor="var(--c3)" />
                  </linearGradient>
                  <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--c2)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--c2)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 20 78 C 55 78, 55 30, 90 30 S 125 88, 160 88 S 195 36, 230 36 S 268 62, 282 62 L 282 128 L 20 128 Z"
                  fill="url(#fade)"
                  style={{ opacity: 0, animation: "fadein 1.8s ease 2.4s forwards" }}
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

          <ol
            className="flex w-full max-w-[24rem] flex-col gap-3"
            style={{ perspective: "800px" }}
          >
            {[
              ["✏️", "draw your day", "five points. no words, no mood list"],
              ["🫱", "meet one person", "someone whose day looked like yours"],
              ["🎙️", "say something real", "or sing it. badly is fine"],
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

          <div className="max-w-[24rem] text-center text-[13px] opacity-45 lg:text-left">
            <p>
              <strong className="font-medium opacity-90">every voice here is a real person.</strong>{" "}
              no AI wrote any of it, and no bot recorded any of it.
            </p>
            <p className="mt-1.5 text-xs opacity-70">
              no sign-up, no name. nothing leaves this device.
            </p>
          </div>
        </div>
      </div>
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
  const pts = Math.round(delta(before, after) * 100);

  // allowed to be flat or negative. an app that can only report improvement
  // isn't measuring anything, it's agreeing with itself.
  const headline =
    pts > 2
      ? `you're ${pts} points brighter than you were four minutes ago`
      : pts < -2
        ? "it went down. that's real too, and worth knowing"
        : "about the same. that's an honest answer";

  return (
    <div className="rise flex w-full flex-col items-center gap-6 text-center">
      <p className="text-[11px] tracking-[0.25em] uppercase opacity-40">before, after</p>
      <h2 className="display max-w-[20ch] text-3xl lg:text-4xl">{headline}</h2>

      <div className="card w-full max-w-lg rounded-3xl p-5">
        <CurveCanvas curve={after} ghost={before} readOnly label="Your day, before and after" />
        <div className="mt-3 flex items-center justify-center gap-7 text-sm">
          <span className="opacity-45">before {Math.round(level(before) * 100)}</span>
          <span className="text-xl font-semibold" style={{ color: "var(--c2)" }}>
            {pts >= 0 ? "+" : ""}
            {pts}
          </span>
          <span className="opacity-45">after {Math.round(level(after) * 100)}</span>
        </div>
      </div>

      <p className="max-w-[26rem] text-[15px] leading-relaxed opacity-65">
        most apps ask whether you feel better. this one just measured it, on your own drawing.
        and it shows the number even when the number sucks.
      </p>

      {smiles > 0 && (
        <p className="text-sm">
          <span className="text-2xl">🙂</span>
          <br />
          you&apos;ve made <strong>{smiles}</strong> {smiles === 1 ? "person" : "people"} smile
          <br />
          <span className="text-xs opacity-40">this only goes up. it never resets</span>
        </p>
      )}

      {board.length > 0 && (
        <div className="card w-full max-w-lg rounded-3xl p-5 text-left">
          <p className="mb-3 text-[11px] tracking-[0.25em] uppercase opacity-40">most smiled at</p>
          <ol className="flex flex-col gap-3">
            {board.map((r, i) => (
              <li key={r.clip.id} className="flex items-start gap-3">
                <span className="text-xs tabular-nums opacity-35">{i + 1}</span>
                <span className="text-lg leading-none">{r.clip.emoji}</span>
                <span className="flex-1 text-[13px] leading-snug opacity-75">{r.clip.caption}</span>
                <span className="text-xs whitespace-nowrap opacity-55">{r.smiles} 🙂</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[11px] opacity-30">
            counted on this device. a shared board needs the server-side pool
          </p>
        </div>
      )}

      {past.length > 1 && <HistoryStrip past={past} />}

      <button
        onClick={() => window.location.reload()}
        className="rounded-full border border-[var(--line)] px-7 py-3 text-sm opacity-65 transition-opacity hover:opacity-100"
      >
        again tomorrow
      </button>
    </div>
  );
}

/** your last fortnight, one bar a day: where you ended up */
function HistoryStrip({ past }: { past: Day[] }) {
  const days = past.slice(-14);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-end gap-1" role="img" aria-label={`Your last ${days.length} days`}>
        {days.map((d, i) => {
          const b = level(d.before);
          const a = level(d.after);
          return (
            <div
              key={i}
              className="flex w-2.5 flex-col items-center justify-end"
              style={{ height: 34 }}
            >
              <div
                className="w-full rounded-full"
                style={{
                  height: `${Math.max(8, a * 100)}%`,
                  background: a >= b ? "var(--c2)" : "var(--line)",
                }}
                title={`${a >= b ? "+" : ""}${Math.round((a - b) * 100)}`}
              />
            </div>
          );
        })}
      </div>
      <p className="text-[11px] opacity-35">
        your last {days.length} {days.length === 1 ? "day" : "days"}. violet means it lifted
      </p>
    </div>
  );
}
