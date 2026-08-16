/**
 * A day is five points, morning to night, each between 0 (heavy) and 1 (bright).
 *
 * Five is deliberate. Three can't hold a dip-and-recover, and seven is more
 * self-reporting than anyone wants to do on a bad day. Five is one drag.
 */
export const POINTS = 5;

export const SLOT_LABELS = ["morning", "midday", "afternoon", "evening", "night"] as const;
export const NOW_LABEL = "right now";

export type Curve = number[];

export const FLAT: Curve = [0.5, 0.5, 0.5, 0.5, 0.5];

/** Where each point sits: Low / Mid / High. The whole day becomes 5 letters. */
export type Band = "L" | "M" | "H";

export function band(v: number): Band {
  if (v < 0.34) return "L";
  if (v < 0.67) return "M";
  return "H";
}

/**
 * The shape signature — "LLMHH", "HMLLM". Two people match when their days had
 * the same shape, not when they picked the same word for a feeling. Nobody has
 * to name anything, which is the point: naming the feeling is the part you
 * can't do on the day you most need this.
 */
export function signature(curve: Curve): string {
  return curve.map(band).join("");
}

/**
 * Distance between two days. Lower is closer. Plain Euclidean over the five
 * points — deliberately arithmetic, not a model. Nothing here decides how
 * anyone feels; it only measures how far apart two drawings are.
 */
export function distance(a: Curve, b: Curve): number {
  let sum = 0;
  for (let i = 0; i < POINTS; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

/** The day's overall level — the average height of the curve. */
export function level(curve: Curve): number {
  return curve.reduce((s, v) => s + v, 0) / curve.length;
}

/** Which slot was the lowest point of the day. */
export function lowestSlot(curve: Curve): number {
  let idx = 0;
  for (let i = 1; i < curve.length; i++) if (curve[i] < curve[idx]) idx = i;
  return idx;
}

/**
 * The day already happened. Hearing from someone doesn't retroactively change
 * what your afternoon was like, so asking you to redraw the whole thing would
 * be measuring the wrong thing (and inviting you to lie about your own
 * morning).
 *
 * What can change is where you are *right now*. So the curve gains one more
 * point on the end instead of being redrawn, and the number is the distance
 * between the last point of your day and that one.
 *
 * It is allowed to be negative. Something that can only report improvement
 * isn't measuring anything, it's agreeing with itself.
 */
export function extend(day: Curve, now: number): Curve {
  return [...day, Math.max(0, Math.min(1, now))];
}

export function deltaNow(day: Curve, now: number): number {
  return now - day[day.length - 1];
}

/** Kept for the older two-curve comparison in tests. */
export function delta(before: Curve, after: Curve): number {
  return level(after) - level(before);
}

/** Colour for a point: heavy days run warm/red, bright days run green. */
export function colorAt(v: number): string {
  const clamped = Math.max(0, Math.min(1, v));
  // 8deg (warm red) -> 152deg (green), staying in a soft, non-clinical band
  const hue = 8 + clamped * 144;
  const sat = 62 - clamped * 12;
  const light = 52 + clamped * 8;
  return `hsl(${hue} ${sat}% ${light}%)`;
}

/** Plain-language read of a shape, computed — never generated. */
export function describe(curve: Curve): string {
  const lo = lowestSlot(curve);
  const lvl = level(curve);
  const spread = Math.max(...curve) - Math.min(...curve);

  if (spread < 0.15) {
    if (lvl < 0.35) return "flat and heavy, all day";
    if (lvl > 0.65) return "steady and bright";
    return "level — nothing much either way";
  }
  if (curve[4] > curve[0] + 0.2) return `started low, came up by ${SLOT_LABELS[4]}`;
  if (curve[0] > curve[4] + 0.2) return `started okay, sank by ${SLOT_LABELS[4]}`;
  return `dipped hardest around ${SLOT_LABELS[lo]}`;
}
