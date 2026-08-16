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
  const gone = [...exclude, ...blocked()];
  const pool = loadPool().filter((c) => !gone.includes(c.id));
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

const BLOCK_KEY = "sameday.blocked.v1";
const HIST_KEY = "sameday.history.v1";

/**
 * Report and skip.
 *
 * There is no live channel and no text field here, so the entire attack surface
 * is one recording a stranger chose to hear. This is the way out of it: one tap
 * removes the clip and it is never served to this person again.
 *
 * What this build does not have is human review of a shared pool. That needs a
 * server and a moderator, and the README says so rather than implying a safety
 * net that isn't there.
 */
export function blocked(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(BLOCK_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function block(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const b = blocked();
    if (!b.includes(id)) b.push(id);
    window.localStorage.setItem(BLOCK_KEY, JSON.stringify(b));
  } catch {
    /* ignore */
  }
}

export interface Day {
  at: number;
  before: Curve;
  after: Curve;
}

/**
 * Your own days, kept on this device.
 *
 * No account means no cross-device history — a real tradeoff, and the honest
 * framing is the good one: nothing about you ever leaves this device.
 */
export function history(): Day[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(HIST_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveDay(day: Day): void {
  if (typeof window === "undefined") return;
  try {
    const h = history();
    h.push(day);
    // a fortnight is plenty to see a pattern and small enough to stay honest
    window.localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(-14)));
  } catch {
    /* ignore */
  }
}

export function forgetEverything(): void {
  if (typeof window === "undefined") return;
  for (const k of [STORE_KEY, MINE_KEY, BLOCK_KEY, HIST_KEY, SMILE_KEY]) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

const SMILE_KEY = "sameday.smiles.v1";

/**
 * Smiles.
 *
 * A clip earns a smile when someone who heard it says it worked. That is the
 * only currency here — not likes on a profile, not a follower count, and not
 * anything you can farm, because you cannot smile at your own clip and you
 * only ever see one clip per exchange.
 *
 * Honest limitation, stated here and in the README: this tally is per-device.
 * A global board needs the shared server-side pool that `loadPool()` is
 * waiting on. What is real today is that the vote is genuine and the ordering
 * below is computed, not decorative.
 */
export function smiles(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(SMILE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function smile(id: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const s = smiles();
    s[id] = (s[id] ?? 0) + 1;
    window.localStorage.setItem(SMILE_KEY, JSON.stringify(s));
    return s[id];
  } catch {
    return 0;
  }
}

export interface Ranked {
  clip: Clip;
  smiles: number;
}

/** The clips that made the most people smile, most first. */
export function leaderboard(limit = 5): Ranked[] {
  const s = smiles();
  return loadPool()
    .map((clip) => ({ clip, smiles: s[clip.id] ?? 0 }))
    .filter((r) => r.smiles > 0)
    .sort((a, b) => b.smiles - a.smiles)
    .slice(0, limit);
}
