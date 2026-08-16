import { SEEDS, type Seed } from "./seeds";
import { distance, type Curve } from "./curve";

const STORE_KEY = "sameday.pool.v1";
const MINE_KEY = "sameday.mine.v1";

export interface Clip extends Seed {
  /** Recorded in this browser rather than shipped with the app. */
  local?: boolean;
  /** Base64 data URL, for locally recorded audio. */
  data?: string;
  at?: number;
}

/**
 * Storage lives behind this one module on purpose.
 *
 * In this build the pool is the shipped seed clips plus anything recorded on
 * this device, kept in localStorage. That is a real limitation and the README
 * says so — a shared server-side pool is the next step, and it only has to
 * replace the four functions below.
 */
export function loadPool(): Clip[] {
  if (typeof window === "undefined") return SEEDS;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const local: Clip[] = raw ? JSON.parse(raw) : [];
    return [...SEEDS, ...local];
  } catch {
    return SEEDS;
  }
}

export function addClip(clip: Clip): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const local: Clip[] = raw ? JSON.parse(raw) : [];
    local.push({ ...clip, local: true, at: Date.now() });
    window.localStorage.setItem(STORE_KEY, JSON.stringify(local));
  } catch {
    /* a full or blocked localStorage must never break the exchange */
  }
}

/** How many people you've recorded something for. Only ever goes up. */
export function smileCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    return JSON.parse(window.localStorage.getItem(MINE_KEY) ?? "[]").length;
  } catch {
    return 0;
  }
}

export function recordSent(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const mine: string[] = JSON.parse(window.localStorage.getItem(MINE_KEY) ?? "[]");
    mine.push(id);
    window.localStorage.setItem(MINE_KEY, JSON.stringify(mine));
  } catch {
    /* ignore */
  }
}

/**
 * Find the person whose day had the closest shape to yours.
 *
 * `exclude` is how you avoid being handed your own clip back, which would be
 * the bleakest possible bug in an app about not being alone.
 */
export function findMatch(mine: Curve, exclude: string[] = []): Clip | null {
  const pool = loadPool().filter((c) => !exclude.includes(c.id));
  if (pool.length === 0) return null;

  let best = pool[0];
  let bestD = distance(mine, best.curve);
  for (const c of pool.slice(1)) {
    const d = distance(mine, c.curve);
    if (d < bestD) {
      best = c;
      bestD = d;
    }
  }
  return best;
}

/** Plain-language closeness, for showing the match honestly. */
export function closeness(mine: Curve, theirs: Curve): string {
  const d = distance(mine, theirs);
  if (d < 0.25) return "almost exactly the same day";
  if (d < 0.5) return "a very similar day";
  if (d < 0.8) return "a day with the same shape";
  return "the closest day in the pool right now";
}
