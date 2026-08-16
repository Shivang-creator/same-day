import { level, type Curve } from "./curve";

/**
 * What you get asked depends on both days — yours and theirs.
 *
 * This is the part that makes it wholesome instead of generic. Telling someone
 * having their worst week to "share what made you happy" is tone-deaf, and
 * telling someone who just got the job they waited two years for to "say
 * something comforting" wastes the best thing that happened to them all year.
 *
 * So there are two moves, and the pairing decides which one you're asked for:
 *
 *   comfort  — say the thing you'd want said to you
 *   share    — something good happened; say why, and let it travel
 *   lift     — sing it, hum it, or hand over the song/film that fixes a bad day
 */
export type Move = "comfort" | "share" | "lift";

const HEAVY = 0.4;
const BRIGHT = 0.6;

export interface Ask {
  move: Move;
  /** The line above the record button. */
  title: string;
  /** Why you're being asked this, in one line. */
  because: string;
  /** A real example, so nobody stares at a blank button. */
  example: string;
}

export function askFor(mine: Curve, theirs: Curve): Ask {
  const me = level(mine);
  const them = level(theirs);

  // Their day was heavy. Comfort — and the framing that makes it possible is
  // second-person-as-self: people can say to a stranger what they can't say to
  // themselves, and it lands both ways.
  if (them < HEAVY) {
    return {
      move: "comfort",
      title:
        me < HEAVY
          ? "Their day was as heavy as yours. Say the thing you'd want said to you right now."
          : "Their day was heavy and yours wasn't. Say the thing you'd want to hear on a day like theirs.",
      because:
        me < HEAVY
          ? "You already know exactly what this feels like. That's why it'll land."
          : "You've got a bit of room today. Spend some of it.",
      example:
        "“This will pass. It's a learning. Start harder tomorrow — and don't let some marks break your smile.”",
    };
  }

  // Their day went well and so did yours. Pass the good thing on.
  if (me > BRIGHT) {
    return {
      move: "share",
      title: "Something went right today. Say what — and let someone else feel it.",
      because: "Good news shared is the cheapest way to make a stranger's day.",
      example:
        "“I'm so happy today. Two years without a job, and today I finally got one. I really hope life gives you this too.”",
    };
  }

  // Theirs was fine, yours wasn't. Say what you needed — someone will need it.
  return {
    move: "comfort",
    title: "Say something you'd want to hear. Someone out there needs exactly that.",
    because: "It doesn't have to be advice. It just has to be kind.",
    example:
      "“You got through today. That counted, even if nobody saw it.”",
  };
}

/** The prompt a seed clip was recorded against, for showing on the receiving end. */
export function moveLabel(move: Move): string {
  if (move === "comfort") return "they were asked to say the thing they'd want to hear";
  if (move === "share") return "they were asked to share something good";
  return "they were asked to sing it, or hand over what fixes a bad day";
}

/**
 * Every fourth exchange asks for a song instead of a sentence.
 *
 * Music is the most reliable mood-repair tool there is, and singing bonds
 * people faster than talking does — so once in a while the right move isn't
 * words at all. It also stops the app becoming relentlessly earnest, which is
 * its own kind of exhausting.
 */
export function liftAsk(): Ask {
  return {
    move: "lift",
    title: "Sing it. Hum it. Or just name the song that fixes a bad day.",
    because: "No words needed. Badly sung counts — arguably counts more.",
    example:
      "“Okay this is going to be rough but —” (thirty seconds of you butchering the chorus), or “put on Ilahi and go stand outside, trust me.”",
  };
}
