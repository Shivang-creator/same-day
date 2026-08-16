import { beforeEach, describe as group, expect, test } from "vitest";
import { addClip, closeness, findMatch, loadPool, recordSent, smileCount } from "./pool";
import { SEEDS } from "./seeds";
import { distance } from "./curve";

beforeEach(() => window.localStorage.clear());

group("the pool", () => {
  test("starts as the shipped seeds", () => {
    expect(loadPool()).toHaveLength(SEEDS.length);
  });

  test("every seed carries an emoji, so a missing audio file can't leave a blank reply", () => {
    for (const s of SEEDS) expect(s.emoji.length).toBeGreaterThan(0);
  });

  test("grows when a clip is recorded", () => {
    addClip({ id: "x1", curve: [0.5, 0.5, 0.5, 0.5, 0.5], prompt: "p", emoji: "🙂" });
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
    addClip({ id: "mine", curve: mine, prompt: "p", emoji: "🙂" });
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
