import type { Curve } from "./curve";

/**
 * The starting pool.
 *
 * Every clip here is a real person's real voice, recorded for this. None of it
 * is generated, and none of it is an actor reading a script — the prompt is
 * what they were asked, and what they said is theirs.
 *
 * A cold-start pool is seeded by definition, and the README says so plainly
 * rather than implying a crowd that doesn't exist yet. Clips recorded by
 * anyone using the app join this pool and are served the same way.
 *
 * To add one: drop the audio in `public/voices/` and add a row below. If the
 * file is missing the row still works — it falls back to the emoji reply, so a
 * half-filled pool degrades instead of breaking.
 */
export interface Seed {
  id: string;
  /** The shape of the day this person was having when they recorded it. */
  curve: Curve;
  /** What they were asked. */
  prompt: string;
  /** Audio in public/voices/. Optional — omit and the emoji carries it. */
  audio?: string;
  /** Always present. This is what plays when audio can't. */
  emoji: string;
  /** Optional caption, for anyone who can't or won't play audio. */
  caption?: string;
}

export const PROMPTS = [
  "Say the thing you wish someone had said to you today.",
  "Tell them one small thing that went right.",
  "What's something stupid that made you laugh recently?",
  "Tell them what you'd do with them if they were here.",
  "Say something you'd say to yourself a year ago.",
  "What are you looking forward to, even a little?",
] as const;

export const SEEDS: Seed[] = [
  {
    id: "s01",
    curve: [0.2, 0.25, 0.15, 0.3, 0.35],
    prompt: PROMPTS[0],
    audio: "/voices/01.webm",
    emoji: "🫂",
    caption: "You're doing better than you think you are.",
  },
  {
    id: "s02",
    curve: [0.7, 0.6, 0.45, 0.5, 0.6],
    prompt: PROMPTS[1],
    audio: "/voices/02.webm",
    emoji: "☕",
    caption: "The chai today was genuinely perfect. That's it. That's the win.",
  },
  {
    id: "s03",
    curve: [0.3, 0.2, 0.25, 0.4, 0.55],
    prompt: PROMPTS[2],
    audio: "/voices/03.webm",
    emoji: "😂",
    caption: "My own alarm scared me. In my own room. That I set.",
  },
  {
    id: "s04",
    curve: [0.5, 0.55, 0.6, 0.45, 0.4],
    prompt: PROMPTS[3],
    audio: "/voices/04.webm",
    emoji: "🚶",
    caption: "Nothing. Just walk somewhere and not talk. That's allowed.",
  },
  {
    id: "s05",
    curve: [0.15, 0.2, 0.3, 0.35, 0.25],
    prompt: PROMPTS[4],
    audio: "/voices/05.webm",
    emoji: "🌱",
    caption: "The thing you're panicking about — you won't remember it.",
  },
  {
    id: "s06",
    curve: [0.8, 0.75, 0.7, 0.8, 0.85],
    prompt: PROMPTS[5],
    audio: "/voices/06.webm",
    emoji: "🎧",
    caption: "New album drops Friday and I have plans to do nothing else.",
  },
  {
    id: "s07",
    curve: [0.45, 0.3, 0.2, 0.25, 0.4],
    prompt: PROMPTS[0],
    audio: "/voices/07.webm",
    emoji: "🕯️",
    caption: "It's okay that today was mostly just getting through it.",
  },
  {
    id: "s08",
    curve: [0.6, 0.65, 0.5, 0.35, 0.3],
    prompt: PROMPTS[1],
    audio: "/voices/08.webm",
    emoji: "📞",
    caption: "Someone called me for no reason. No reason! People still do that.",
  },
  {
    id: "s09",
    curve: [0.35, 0.4, 0.55, 0.65, 0.7],
    prompt: PROMPTS[2],
    audio: "/voices/09.webm",
    emoji: "🐕",
    caption: "A dog outside the shop chose me. Out of everyone. Me.",
  },
  {
    id: "s10",
    curve: [0.25, 0.35, 0.4, 0.3, 0.2],
    prompt: PROMPTS[3],
    audio: "/voices/10.webm",
    emoji: "🍜",
    caption: "Maggi at 2am, no talking, bad TV. That's the whole plan.",
  },
];
