"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CurveCanvas } from "@/components/CurveCanvas";
import { Recorder } from "@/components/Recorder";
import { FLAT, delta, describe, level, type Curve } from "@/lib/curve";
import { PROMPTS } from "@/lib/seeds";
import { addClip, closeness, findMatch, recordSent, smileCount, type Clip } from "@/lib/pool";

type Stage = "intro" | "draw" | "match" | "give" | "receive" | "after" | "result";

export default function Page() {
  const [stage, setStage] = useState<Stage>("intro");
  const [before, setBefore] = useState<Curve>(FLAT);
  const [after, setAfter] = useState<Curve>(FLAT);
  const [match, setMatch] = useState<Clip | null>(null);
  const [smiles, setSmiles] = useState(0);
  const [touched, setTouched] = useState(false);

  useEffect(() => setSmiles(smileCount()), [stage]);

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
      {stage === "intro" && (
        <div className="rise flex flex-col items-center gap-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] opacity-45">Same Day</p>
          <h1 className="text-[28px] leading-[1.25] font-medium text-balance">
            Somebody out there had the exact same day as you.
          </h1>
          <p className="max-w-[20rem] text-[15px] leading-relaxed opacity-65">
            Draw yours. We&apos;ll find them. You get ten seconds to make them smile — then
            you&apos;ll hear what they said to you.
          </p>
          <button
            onClick={() => setStage("draw")}
            className="rounded-full bg-[var(--ink)] px-8 py-3.5 text-[15px] font-medium text-[var(--ground)] transition-transform active:scale-95"
          >
            Draw my day
          </button>
          <p className="text-xs opacity-40">no sign-up · no name · nothing kept</p>
        </div>
      )}

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
            onClick={() => setStage("result")}
            className="rounded-full bg-[var(--ink)] px-8 py-3.5 text-[15px] font-medium text-[var(--ground)] transition-transform active:scale-95"
          >
            Show me
          </button>
        </div>
      )}

      {stage === "result" && <Result before={before} after={after} smiles={smiles} />}
    </main>
  );
}

function Result({ before, after, smiles }: { before: Curve; after: Curve; smiles: number }) {
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
