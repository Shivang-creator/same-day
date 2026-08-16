import { describe as group, expect, test } from "vitest";
import { askFor, moveLabel } from "./prompts";

const heavy = [0.15, 0.2, 0.15, 0.2, 0.2];
const bright = [0.85, 0.8, 0.9, 0.85, 0.8];
const middling = [0.5, 0.5, 0.5, 0.5, 0.5];

group("askFor", () => {
  // The whole point of branching: never tell someone having their worst week
  // to share what made them happy.
  test("a heavy day on their side always asks for comfort, whatever yours was", () => {
    expect(askFor(heavy, heavy).move).toBe("comfort");
    expect(askFor(bright, heavy).move).toBe("comfort");
    expect(askFor(middling, heavy).move).toBe("comfort");
  });

  test("two good days asks you to pass the good thing on", () => {
    expect(askFor(bright, bright).move).toBe("share");
  });

  test("your bad day against their fine one still asks for comfort", () => {
    expect(askFor(heavy, middling).move).toBe("comfort");
  });

  test("the wording changes when you're the one with room to spare", () => {
    expect(askFor(heavy, heavy).title).not.toBe(askFor(bright, heavy).title);
  });

  test("every pairing produces a title, a reason and a worked example", () => {
    for (const mine of [heavy, middling, bright]) {
      for (const theirs of [heavy, middling, bright]) {
        const a = askFor(mine, theirs);
        expect(a.title.length).toBeGreaterThan(0);
        expect(a.because.length).toBeGreaterThan(0);
        expect(a.example.length).toBeGreaterThan(0);
      }
    }
  });
});

group("moveLabel", () => {
  test("describes both moves in the receiver's words", () => {
    expect(moveLabel("comfort")).toContain("hear");
    expect(moveLabel("share")).toContain("good");
  });
});
