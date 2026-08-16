"use client";

import { useEffect, useState } from "react";

/** The mark: the same curve the whole app is about, drawn small. */
export function Mark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 68 34" aria-hidden="true">
      <defs>
        <linearGradient id="markgrad" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--c1)" />
          <stop offset="52%" stopColor="var(--c2)" />
          <stop offset="100%" stopColor="var(--c3)" />
        </linearGradient>
      </defs>
      <path
        d="M 4 24 C 13 24, 13 8, 22 8 S 31 27, 40 27 S 49 9, 58 9 S 64 17, 64 17"
        fill="none"
        stroke="url(#markgrad)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Shows the mark in the middle of the screen once, then it moves to the corner
 * and stays there.
 *
 * Only on the first load of a session. Making someone sit through a splash
 * every single time is how you teach them to hate an app they otherwise liked,
 * and the whole point of this one is that it takes four minutes.
 */
export function LogoIntro() {
  const [phase, setPhase] = useState<"hidden" | "splash" | "corner">("hidden");

  // sessionStorage is browser-only, so the first paint cannot know whether the
  // splash has already been shown. This has to run after mount.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem("sameday.splash") === "1";
    } catch {
      /* private mode: just show it */
    }

    if (seen) {
      setPhase("corner");
      return;
    }

    setPhase("splash");
    try {
      window.sessionStorage.setItem("sameday.splash", "1");
    } catch {
      /* ignore */
    }

    const t = setTimeout(() => setPhase("corner"), 1700);
    return () => clearTimeout(t);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (phase === "hidden") return null;

  if (phase === "corner") {
    return (
      <a
        href="/"
        aria-label="Same Day, back to the start"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 rounded-full opacity-70 transition-opacity hover:opacity-100"
      >
        <Mark size={30} />
        <span className="text-[11px] tracking-[0.28em] uppercase opacity-60">same day</span>
      </a>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center"
      style={{ background: "var(--ground)", animation: "splashout 0.5s ease 1.2s forwards" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div style={{ animation: "markin 1s cubic-bezier(0.2, 0.8, 0.2, 1) both" }}>
          <Mark size={120} />
        </div>
        <span
          className="text-[12px] tracking-[0.4em] uppercase opacity-0"
          style={{ animation: "fadein 0.7s ease 0.55s forwards" }}
        >
          same day
        </span>
      </div>
    </div>
  );
}
