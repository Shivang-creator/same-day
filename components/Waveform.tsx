"use client";

import { useEffect, useRef, useState } from "react";

const BARS = 40;

/**
 * The voice, drawn while it plays.
 *
 * An <audio> element is a grey rectangle — it makes a person sound like a file.
 * This reads the live frequency data and draws it as bars in the same warm
 * gradient as everything else, so what you're looking at moves when they
 * breathe. It is the difference between playing a clip and being talked to.
 *
 * If the Web Audio API is unavailable or the browser blocks it, the plain
 * controls underneath still work — the waveform is decoration over a working
 * player, never the only way to hear it.
 */
export function Waveform({ src, label }: { src: string; label?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [levels, setLevels] = useState<number[]>(() => new Array(BARS).fill(0.06));
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      void ctxRef.current?.close();
    };
  }, []);

  function attach() {
    const el = audioRef.current;
    if (!el || ctxRef.current) return;
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      ctx.createMediaElementSource(el).connect(analyser);
      analyser.connect(ctx.destination);

      const buf = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(buf);
        const next: number[] = [];
        const step = Math.floor(buf.length / BARS) || 1;
        for (let i = 0; i < BARS; i++) {
          next.push(Math.max(0.06, buf[i * step] / 255));
        }
        setLevels(next);
        raf.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      /* no Web Audio — the controls below still play it */
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => {
          const el = audioRef.current;
          if (!el) return;
          attach();
          void ctxRef.current?.resume();
          if (el.paused) void el.play();
          else el.pause();
        }}
        aria-label={playing ? "Pause" : "Play their reply"}
        className="flex h-20 w-full items-center justify-center gap-[3px] rounded-2xl px-3 transition-opacity hover:opacity-90"
      >
        {levels.map((v, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="flex-1 rounded-full"
            style={{
              height: `${Math.round(v * 100)}%`,
              minHeight: 4,
              background: `linear-gradient(180deg, #f4a259, #e8705a)`,
              opacity: playing ? 1 : 0.4,
              transition: "height 90ms linear, opacity 250ms",
            }}
          />
        ))}
      </button>

      <p className="mt-1 text-center text-xs opacity-45">
        {playing ? "playing — a real person, really said this" : "tap the wave to play"}
      </p>

      <audio
        ref={audioRef}
        src={src}
        controls
        preload="metadata"
        aria-label={label ?? "Their reply"}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setLevels(new Array(BARS).fill(0.06));
        }}
        className="mt-2 w-full opacity-60"
      />
    </div>
  );
}
