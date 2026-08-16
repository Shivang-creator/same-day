import { beforeEach, describe as group, expect, test } from "vitest";
import {
  addClip,
  block,
  blocked,
  closeness,
  findMatch,
  forgetEverything,
  history,
  leaderboard,
  loadPool,
  recordSent,
  saveDay,
  smile,
  smileCount,
  smiles,
} from "./pool";
import { SEEDS } from "./seeds";
import { FLAT, distance } from "./curve";

beforeEach(() => window.localStorage.clear());

group("the pool", () => {
  test("starts as the shipped seeds", () => {
    expect(loadPool()).toHaveLength(SEEDS.length);
  });

  test("every seed carries an emoji, so a missing audio file can't leave a blank reply", () => {
    for (const s of SEEDS) expect(s.emoji.length).toBeGreaterThan(0);
  });

  test("grows when a clip is recorded", () => {
    addClip({ id: "x1", curve: [0.5, 0.5, 0.5, 0.5, 0.5], move: "comfort", emoji: "🙂", caption: "" });
    expect(loadPool()).toHaveLength(SEEDS.length + 1);
  });

  test("survives a broken localStorage instead of throwing", () => {
    window.localStorage.setItem("sameday.pool.v1", "{not json");
    expect(() => loadPool()).not.toThrow();
    expect(loadPool()).toHaveLength(SEEDS.length);
  });
});

group("findMatch", () => {
  test("returns the closest day in the pool", () => {
    const mine = [0.2, 0.25, 0.15, 0.3, 0.35];
    const got = findMatch(mine)!;
    const best = SEEDS.reduce((a, b) => (distance(mine, a.curve) <= distance(mine, b.curve) ? a : b));
    expect(got.id).toBe(best.id);
  });

  // The bleakest possible bug in an app about not being alone.
  test("never hands you your own clip back", () => {
    const mine = [0.99, 0.99, 0.99, 0.99, 0.99];
    addClip({ id: "mine", curve: mine, move: "comfort", emoji: "🙂", caption: "" });
    expect(findMatch(mine, ["mine"])!.id).not.toBe("mine");
  });

  test("returns null only when everything is excluded", () => {
    const all = loadPool().map((c) => c.id);
    expect(findMatch([0.5, 0.5, 0.5, 0.5, 0.5], all)).toBeNull();
  });

  test("always finds someone for any drawable day", () => {
    for (let v = 0; v <= 1.0001; v += 0.1) {
      expect(findMatch([v, v, v, v, v])).not.toBeNull();
    }
  });
});

group("the smile count", () => {
  test("starts at zero and only goes up", () => {
    expect(smileCount()).toBe(0);
    recordSent("a");
    recordSent("b");
    expect(smileCount()).toBe(2);
  });

  // No streak that can be broken. Missing four days must cost nothing.
  test("has no reset path — replaying the same id still only adds", () => {
    recordSent("a");
    recordSent("a");
    expect(smileCount()).toBe(2);
  });
});

group("closeness", () => {
  test("reads closest for an identical day", () => {
    expect(closeness(SEEDS[0].curve, SEEDS[0].curve)).toContain("exactly");
  });

  test("always returns a sentence, however far apart", () => {
    expect(closeness([0, 0, 0, 0, 0], [1, 1, 1, 1, 1]).length).toBeGreaterThan(0);
  });
});

group("blocking", () => {
  test("a blocked clip is never matched again", () => {
    const mine = SEEDS[0].curve;
    const first = findMatch(mine)!;
    block(first.id);
    expect(findMatch(mine)!.id).not.toBe(first.id);
  });

  test("blocking is idempotent", () => {
    block("z");
    block("z");
    expect(blocked().filter((x) => x === "z")).toHaveLength(1);
  });
});

group("history", () => {
  test("starts empty and records days in order", () => {
    expect(history()).toHaveLength(0);
    saveDay({ at: 1, before: [0.2, 0.2, 0.2, 0.2, 0.2], after: [0.4, 0.4, 0.4, 0.4, 0.4] });
    saveDay({ at: 2, before: [0.5, 0.5, 0.5, 0.5, 0.5], after: [0.5, 0.5, 0.5, 0.5, 0.5] });
    expect(history().map((d) => d.at)).toEqual([1, 2]);
  });

  test("keeps only the last fortnight", () => {
    for (let i = 0; i < 20; i++) saveDay({ at: i, before: FLAT, after: FLAT });
    const h = history();
    expect(h).toHaveLength(14);
    expect(h[0].at).toBe(6);
  });

  test("forgetEverything really does", () => {
    saveDay({ at: 1, before: FLAT, after: FLAT });
    recordSent("a");
    block("b");
    addClip({ id: "c", curve: FLAT, move: "comfort", emoji: "🙂", caption: "" });
    forgetEverything();
    expect(history()).toHaveLength(0);
    expect(smileCount()).toBe(0);
    expect(blocked()).toHaveLength(0);
    expect(loadPool()).toHaveLength(SEEDS.length);
  });
});

group("smiles", () => {
  test("start empty and count up per clip", () => {
    expect(smiles()).toEqual({});
    smile("a");
    smile("a");
    smile("b");
    expect(smiles()).toEqual({ a: 2, b: 1 });
  });

  test("the board ranks by smiles, most first", () => {
    smile(SEEDS[2].id);
    smile(SEEDS[0].id);
    smile(SEEDS[0].id);
    smile(SEEDS[0].id);
    const board = leaderboard();
    expect(board[0].clip.id).toBe(SEEDS[0].id);
    expect(board[0].smiles).toBe(3);
    expect(board[1].clip.id).toBe(SEEDS[2].id);
  });

  test("clips nobody smiled at never appear", () => {
    smile(SEEDS[1].id);
    expect(leaderboard().every((r) => r.smiles > 0)).toBe(true);
    expect(leaderboard()).toHaveLength(1);
  });

  test("the board honours its limit", () => {
    for (const s of SEEDS) smile(s.id);
    expect(leaderboard(3)).toHaveLength(3);
  });

  test("forgetEverything clears the smiles too", () => {
    smile("a");
    forgetEverything();
    expect(smiles()).toEqual({});
  });
});
