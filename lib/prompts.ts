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
          ? "their day was as rough as yours. say what you'd want to hear right now."
          : "their day was rough and yours wasn't. say what you'd want to hear on a day like that.",
      because:
        me < HEAVY
          ? "you already know what this feels like. that's why it lands."
          : "you've got room today. spend a bit of it.",
      example:
        "“this will pass. it's a learning. start harder tomorrow, and don't let some marks break your smile.”",
    };
  }

  // Their day went well and so did yours. Pass the good thing on.
  if (me > BRIGHT) {
    return {
      move: "share",
      title: "something went right today. tell them what.",
      because: "someone out there needs to hear that good things still happen.",
      example:
        "“i'm so happy today. two years without a job and today i finally got one. i really hope life gives you this too.”",
    };
  }

  // Theirs was fine, yours wasn't. Say what you needed — someone will need it.
  return {
    move: "comfort",
    title: "say something you'd want to hear. someone out there needs exactly that.",
    because: "it doesn't have to be advice. just kind.",
    example:
      "“you got through today. that counted, even if nobody saw it.”",
  };
}

/** The prompt a seed clip was recorded against, for showing on the receiving end. */
export function moveLabel(move: Move): string {
  if (move === "comfort") return "they were asked to say what they'd want to hear";
  if (move === "share") return "they were asked to share something good";
  return "they were asked to sing it, or name what fixes a bad day";
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
    title: "sing it. hum it. or just name the song that fixes a bad day.",
    because: "no words needed. badly sung counts more, honestly.",
    example:
      "“okay this is going to be rough but...” then thirty seconds of you butchering the chorus. or just: “put on Ilahi and go stand outside. trust me.”",
  };
}
