"use client";

import { useEffect, useRef, useState } from "react";
import { PROMPTS, SEEDS } from "@/lib/seeds";

/**
 * A builder tool, not part of the product.
 *
 * The starting pool has to be real human voices or the whole premise is a lie,
 * so this records them and downloads each as the exact filename `lib/seeds.ts`
 * already expects. Ten clips, one sitting, no audio editor.
 *
 * Not linked from anywhere in the app.
 */
export default function SeedPage() {
  const [idx, setIdx] = useState(0);
  const [state, setState] = useState<"idle" | "rec" | "done">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState<number[]>([]);
  const [secs, setSecs] = useState(0);

  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => tick.current && clearInterval(tick.current), []);

  const seed = SEEDS[idx];
  const num = String(idx + 1).padStart(2, "0");

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks.current = [];
    const r = new MediaRecorder(stream);
    rec.current = r;
    r.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
    r.onstop = () => {
      tick.current && clearInterval(tick.current);
      stream.getTracks().forEach((t) => t.stop());
      setUrl(URL.createObjectURL(new Blob(chunks.current, { type: "audio/webm" })));
      setState("done");
    };
    r.start();
    setSecs(0);
    setState("rec");
    const t0 = Date.now();
    tick.current = setInterval(() => {
      const s = (Date.now() - t0) / 1000;
      setSecs(s);
      if (s >= 10) r.stop();
    }, 100);
  }

  function save() {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${num}.webm`;
    a.click();
    setSaved((s) => [...s, idx]);
    setUrl(null);
    setState("idle");
    if (idx < SEEDS.length - 1) setIdx(idx + 1);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-5 py-10 text-center">
      <p className="text-xs uppercase tracking-[0.2em] opacity-45">
        seeding · {saved.length} of {SEEDS.length} saved
      </p>

      <div className="w-full rounded-2xl bg-[var(--raise)] p-5">
        <p className="text-xs opacity-50">clip {num} — say it like you mean it</p>
        <h1 className="mt-2 text-lg leading-snug font-medium text-balance">{seed.prompt}</h1>
        <p className="mt-3 text-xs opacity-45">
          for someone whose day was {seed.caption ? "like this:" : "similar"}{" "}
          {seed.caption && <em>&ldquo;{seed.caption}&rdquo;</em>}
        </p>
      </div>

      {state !== "done" ? (
        <button
          onClick={state === "rec" ? () => rec.current?.stop() : start}
          className="grid h-24 w-24 place-items-center rounded-full text-3xl transition-transform active:scale-95"
          style={{ background: state === "rec" ? "var(--warm)" : "var(--ink)", color: "var(--ground)" }}
        >
          {state === "rec" ? (
            <span className="text-2xl tabular-nums">{(10 - secs).toFixed(0)}</span>
          ) : (
            "🎙️"
          )}
        </button>
      ) : (
        <div className="flex w-full flex-col items-center gap-3">
          <audio src={url!} controls className="w-full" />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setUrl(null);
                setState("idle");
              }}
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm opacity-70"
            >
              Redo
            </button>
            <button
              onClick={save}
              className="rounded-full bg-[var(--ink)] px-6 py-2 text-sm font-medium text-[var(--ground)]"
            >
              Save {num}.webm
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-1.5">
        {SEEDS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              setIdx(i);
              setUrl(null);
              setState("idle");
            }}
            className="h-7 w-7 rounded-lg text-xs"
            style={{
              background: saved.includes(i) ? "var(--warm)" : "var(--raise)",
              outline: i === idx ? "2px solid var(--ink)" : "none",
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <p className="max-w-xs text-xs leading-relaxed opacity-45">
        Each one downloads as <code>NN.webm</code>. Drop all ten into{" "}
        <code>public/voices/</code>. Prompts vary on purpose — different moods, different
        energy, so the pool doesn&apos;t sound like one person on a loop.
      </p>
    </main>
  );
}
