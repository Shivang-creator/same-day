"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Ten seconds is the ask, not the guillotine. The ring completes at TARGET so
// the prompt still reads "ten seconds", but recording runs to CEILING — being
// cut off mid-sentence is worse than saying nothing at all.
const TARGET_MS = 10_000;
const CEILING_MS = 25_000;

const EMOJI = ["🫂", "☕", "😂", "🌱", "🎧", "🕯️", "🐕", "🍜", "✨", "🙂", "🔥", "🌤️"];

type State = "idle" | "recording" | "done" | "denied";

/**
 * Ten seconds of voice, or an emoji.
 *
 * The emoji path is not a consolation prize — a blocked microphone, a borrowed
 * laptop, a shared room at 1am and a judge who won't grant permissions are all
 * ordinary, and none of them should end the experience. Both paths produce a
 * reply; only the medium differs.
 */
export function Recorder({
  onDone,
}: {
  onDone: (reply: { data?: string; emoji: string; seconds: number }) => void;
}) {
  const [state, setState] = useState<State>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [emoji, setEmoji] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  useEffect(() => () => stopTimer(), []);

  const stop = useCallback(() => {
    recRef.current?.state === "recording" && recRef.current.stop();
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const rec = new MediaRecorder(stream);
      recRef.current = rec;

      rec.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
      rec.onstop = () => {
        stopTimer();
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
          setState("done");
        };
        reader.readAsDataURL(blob);
      };

      rec.start();
      startedAt.current = Date.now();
      setElapsed(0);
      setState("recording");
      timer.current = setInterval(() => {
        const ms = Date.now() - startedAt.current;
        setElapsed(ms);
        if (ms >= CEILING_MS) stop();
      }, 100);
    } catch {
      setState("denied");
    }
  }, [stop]);

  const seconds = elapsed / 1000;
  const pct = Math.min(1, elapsed / TARGET_MS);
  const over = elapsed > TARGET_MS;

  if (state === "done" && preview) {
    return (
      <div className="flex flex-col items-center gap-4">
        <audio src={preview} controls className="w-full max-w-xs" aria-label="Your reply" />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setState("idle");
            }}
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm opacity-70 hover:opacity-100"
          >
            Again
          </button>
          <button
            type="button"
            onClick={() => onDone({ data: preview, emoji: emoji ?? "🎙️", seconds })}
            className="rounded-full bg-[var(--ink)] px-6 py-2 text-sm font-medium text-[var(--ground)]"
          >
            Send it
          </button>
        </div>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="max-w-xs text-center text-sm opacity-60">
          No microphone — that&apos;s fine. Pick one instead.
        </p>
        <EmojiPad selected={emoji} onSelect={setEmoji} />
        <button
          type="button"
          disabled={!emoji}
          onClick={() => emoji && onDone({ emoji, seconds: 0 })}
          className="rounded-full bg-[var(--ink)] px-6 py-2 text-sm font-medium text-[var(--ground)] disabled:opacity-30"
        >
          Send it
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={state === "recording" ? stop : start}
        aria-label={state === "recording" ? "Stop recording" : "Record ten seconds"}
        className="relative grid h-24 w-24 place-items-center rounded-full transition-transform active:scale-95"
        style={{
          background: state === "recording" ? "var(--warm)" : "var(--ink)",
          color: "var(--ground)",
        }}
      >
        {state === "recording" ? (
          <>
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="var(--ground)"
                strokeOpacity={0.35}
                strokeWidth="4"
                strokeDasharray={`${pct * 289} 289`}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-2xl font-medium tabular-nums">
              {over ? seconds.toFixed(0) : (TARGET_MS / 1000 - seconds).toFixed(0)}
            </span>
          </>
        ) : (
          <span className="text-3xl">🎙️</span>
        )}
      </button>

      <p className="text-xs opacity-50">
        {state === "recording"
          ? over
            ? "keep going if you need to — tap to stop"
            : "tap to stop"
          : "ten seconds, that's all"}
      </p>

      <details className="text-xs opacity-50">
        <summary className="cursor-pointer hover:opacity-100">can&apos;t talk right now?</summary>
        <div className="mt-3 flex flex-col items-center gap-3">
          <EmojiPad selected={emoji} onSelect={setEmoji} />
          <button
            type="button"
            disabled={!emoji}
            onClick={() => emoji && onDone({ emoji, seconds: 0 })}
            className="rounded-full border border-[var(--line)] px-4 py-1.5 disabled:opacity-30"
          >
            Send this instead
          </button>
        </div>
      </details>
    </div>
  );
}

function EmojiPad({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (e: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-1.5" role="group" aria-label="Pick an emoji reply">
      {EMOJI.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onSelect(e)}
          aria-pressed={selected === e}
          className="grid h-10 w-10 place-items-center rounded-xl text-xl transition-transform hover:scale-110"
          style={{
            background: selected === e ? "var(--warm)" : "var(--raise)",
            outline: selected === e ? "2px solid var(--ink)" : "none",
          }}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
