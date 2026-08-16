import type { Curve } from "./curve";
import type { Move } from "./prompts";

/**
 * The starting pool.
 *
 * Every clip here is a real person's real voice, recorded for this. None of it
 * is generated and none of it is read off a script — the ask is what they were
 * given, and what they said is theirs.
 *
 * A cold-start pool is seeded by definition, and the README says so plainly
 * rather than implying a crowd that doesn't exist yet. Clips recorded by anyone
 * using the app join this pool and are served the same way.
 *
 * To add one: drop the audio in `public/voices/` and add a row. If the file is
 * missing the row still works — the emoji and caption carry it, so a
 * half-filled pool degrades instead of breaking.
 */
export interface Seed {
  id: string;
  /** The shape of the day this person was having. */
  curve: Curve;
  /** Which of the two moves they were asked for. */
  move: Move;
  /** Audio in public/voices/. Optional — the caption carries it if missing. */
  audio?: string;
  /** Always present. This is what shows when audio can't play. */
  emoji: string;
  /** Always present, so anyone who can't or won't play audio still gets it. */
  caption: string;
}

export const SEEDS: Seed[] = [
  {
    id: "s01",
    curve: [0.2, 0.25, 0.15, 0.3, 0.35],
    move: "comfort",
    audio: "/voices/01.webm",
    emoji: "🫂",
    caption:
      "this will pass. it's a learning. start harder tomorrow, and don't let some marks break your smile.",
  },
  {
    id: "s02",
    curve: [0.82, 0.78, 0.75, 0.85, 0.88],
    move: "share",
    audio: "/voices/02.webm",
    emoji: "🎉",
    caption:
      "two years without a job and today i finally got one. i hope life gives you this too.",
  },
  {
    id: "s03",
    curve: [0.3, 0.2, 0.25, 0.4, 0.55],
    move: "comfort",
    audio: "/voices/03.webm",
    emoji: "🌱",
    caption: "you got through today. that counted, even if nobody saw it.",
  },
  {
    id: "s04",
    curve: [0.75, 0.8, 0.7, 0.72, 0.8],
    move: "share",
    audio: "/voices/04.webm",
    emoji: "☀️",
    caption: "my mum called just to talk. no reason. i forgot how much that fixes.",
  },
  {
    id: "s05",
    curve: [0.15, 0.2, 0.3, 0.35, 0.25],
    move: "comfort",
    audio: "/voices/05.webm",
    emoji: "🕯️",
    caption: "the thing you're panicking about tonight, in a year you won't be able to name it.",
  },
  {
    id: "s06",
    curve: [0.7, 0.72, 0.85, 0.8, 0.78],
    move: "lift",
    audio: "/voices/06.webm",
    emoji: "🎶",
    caption: "thirty seconds of me badly singing the one song that always works.",
  },
  {
    id: "s07",
    curve: [0.45, 0.3, 0.2, 0.25, 0.4],
    move: "comfort",
    audio: "/voices/07.webm",
    emoji: "🌧️",
    caption: "it's okay that today was mostly just getting through it. that still counts.",
  },
  {
    id: "s08",
    curve: [0.8, 0.85, 0.78, 0.82, 0.9],
    move: "share",
    audio: "/voices/08.webm",
    emoji: "🥹",
    caption: "a stranger held a door and said my name was nice. i've thought about it all day.",
  },
  {
    id: "s09",
    curve: [0.35, 0.4, 0.55, 0.65, 0.7],
    move: "comfort",
    audio: "/voices/09.webm",
    emoji: "🌤️",
    caption: "it started badly and still turned around. days do that. yours can too.",
  },
  {
    id: "s10",
    curve: [0.25, 0.35, 0.4, 0.3, 0.2],
    move: "lift",
    audio: "/voices/10.webm",
    emoji: "🎬",
    caption: "put this song on and go stand outside for five minutes. trust me.",
  },
];
