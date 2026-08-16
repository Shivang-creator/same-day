"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// thirty seconds is the room you get, not the limit. the ring fills at TARGET
// so the ask stays honest, but recording runs on to CEILING because being cut
// off mid-sentence is worse than saying nothing.
const TARGET_MS = 30_000;
const CEILING_MS = 60_000;

const EMOJI = ["🫂", "😂", "🌱", "🎧", "🕯️", "🐕", "🍜", "✨", "🙂", "🔥", "🌤️", "🎶"];

type State = "idle" | "recording" | "done" | "denied";

export interface Reply {
  data?: string;
  emoji: string;
  text?: string;
  seconds: number;
}

/**
 * Thirty seconds of voice, or type it.
 *
 * Voice is the default because it does the job better. Typing is not a
 * consolation prize though: a blocked mic, a shared room at 1am, a borrowed
 * laptop and someone who just doesn't want to hear their own voice are all
 * ordinary. A single emoji is a shrug, and nobody feels met by a shrug, so the
 * typed path takes a joke, a song, a film, whatever you'd have said out loud.
 */
export function Recorder({ onDone }: { onDone: (reply: Reply) => void }) {
  const [state, setState] = useState<State>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [emoji, setEmoji] = useState<string | null>(null);
  const [text, setText] = useState("");

  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  useEffect(() => stopTimer, []);

  const stop = useCallback(() => {
    if (recRef.current?.state === "recording") recRef.current.stop();
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const rec = new MediaRecorder(stream);
      recRef.current = rec;

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };
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
      setTyping(true);
    }
  }, [stop]);

  const seconds = elapsed / 1000;
  const pct = Math.min(1, elapsed / TARGET_MS);
  const over = elapsed > TARGET_MS;
  const canSendTyped = Boolean(emoji) || text.trim().length >= 2;

  // ---- listen back before it goes ----------------------------------------
  if (state === "done" && preview) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <audio src={preview} controls className="w-full" aria-label="Your reply" />
        <p className="text-xs opacity-45">have a listen. you can redo it</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setState("idle");
            }}
            className="rounded-full border border-[var(--line)] px-5 py-2.5 text-sm opacity-70 hover:opacity-100"
          >
            again
          </button>
          <button
            type="button"
            onClick={() => onDone({ data: preview, emoji: emoji ?? "🎙️", seconds })}
            className="warm-btn rounded-full px-7 py-2.5 text-sm font-semibold"
          >
            send it
          </button>
        </div>
      </div>
    );
  }

  // ---- typed path, either chosen or forced by a blocked mic ---------------
  if (typing) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        {state === "denied" && (
          <p className="text-sm opacity-60">no mic, no problem. type it instead.</p>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 240))}
          rows={4}
          autoFocus
          aria-label="Type your reply"
          placeholder="a joke, a song, a film, or just what you'd have said out loud"
          className="w-full resize-none rounded-2xl bg-[var(--raise)] p-4 text-[15px] leading-relaxed outline-none placeholder:opacity-40 focus-visible:outline-2 focus-visible:outline-[var(--c2)]"
          style={{ border: "1px solid var(--line)" }}
        />

        <div className="flex w-full items-center justify-between px-1">
          <span className="text-[11px] opacity-35">{240 - text.length} left</span>
          <span className="text-[11px] opacity-35">and pick one, if you want</span>
        </div>

        <EmojiPad selected={emoji} onSelect={setEmoji} />

        <div className="flex gap-2">
          {state !== "denied" && (
            <button
              type="button"
              onClick={() => setTyping(false)}
              className="rounded-full border border-[var(--line)] px-5 py-2.5 text-sm opacity-70 hover:opacity-100"
            >
              back to voice
            </button>
          )}
          <button
            type="button"
            disabled={!canSendTyped}
            onClick={() =>
              onDone({ emoji: emoji ?? "🙂", text: text.trim() || undefined, seconds: 0 })
            }
            className="warm-btn rounded-full px-7 py-2.5 text-sm font-semibold disabled:opacity-30"
          >
            send it
          </button>
        </div>
      </div>
    );
  }

  // ---- the default: record ------------------------------------------------
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={state === "recording" ? stop : start}
        aria-label={state === "recording" ? "Stop recording" : "Record up to thirty seconds"}
        className="relative grid h-28 w-28 place-items-center rounded-full transition-transform active:scale-95"
        style={{
          background:
            state === "recording"
              ? "var(--c3)"
              : "linear-gradient(120deg, var(--c1), var(--c2) 55%, var(--c3))",
          color: "#fff",
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
                stroke="#fff"
                strokeOpacity={0.4}
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
            ? "keep going. tap to stop"
            : "tap to stop"
          : "you've got thirty seconds"}
      </p>

      {state !== "recording" && (
        <button
          type="button"
          onClick={() => setTyping(true)}
          className="rounded-full border border-[var(--line)] px-5 py-2.5 text-sm opacity-70 transition-opacity hover:opacity-100"
        >
          or type it instead
        </button>
      )}
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
    <div className="grid grid-cols-6 gap-1.5" role="group" aria-label="Pick an emoji">
      {EMOJI.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onSelect(e)}
          aria-pressed={selected === e}
          className="grid h-10 w-10 place-items-center rounded-xl text-xl transition-transform hover:scale-110"
          style={{
            background: selected === e ? "var(--c2)" : "var(--raise)",
            outline: selected === e ? "2px solid var(--c2)" : "none",
          }}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
