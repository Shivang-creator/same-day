import { describe as group, expect, test } from "vitest";
import {
  FLAT,
  band,
  delta,
  describe,
  distance,
  level,
  lowestSlot,
  signature,
  colorAt,
} from "./curve";

group("band", () => {
  test("splits at the thirds", () => {
    expect(band(0)).toBe("L");
    expect(band(0.33)).toBe("L");
    expect(band(0.34)).toBe("M");
    expect(band(0.66)).toBe("M");
    expect(band(0.67)).toBe("H");
    expect(band(1)).toBe("H");
  });
});

group("signature", () => {
  test("is five letters, one per slot", () => {
    expect(signature([0.1, 0.5, 0.9, 0.5, 0.1])).toBe("LMHML");
  });

  test("a flat day is all mid", () => {
    expect(signature(FLAT)).toBe("MMMMM");
  });
});

group("distance", () => {
  test("is zero for the same day", () => {
    expect(distance(FLAT, FLAT)).toBe(0);
  });

  test("grows as days diverge", () => {
    const mine = [0.5, 0.5, 0.5, 0.5, 0.5];
    const near = [0.6, 0.5, 0.5, 0.5, 0.5];
    const far = [0.0, 0.0, 0.0, 0.0, 0.0];
    expect(distance(mine, near)).toBeLessThan(distance(mine, far));
  });

  test("is symmetric", () => {
    const a = [0.1, 0.9, 0.2, 0.8, 0.3];
    const b = [0.7, 0.2, 0.6, 0.1, 0.5];
    expect(distance(a, b)).toBeCloseTo(distance(b, a), 12);
  });
});

group("level and lowestSlot", () => {
  test("level is the mean height", () => {
    expect(level([0, 0.5, 1, 0.5, 0])).toBeCloseTo(0.4, 10);
  });

  test("finds the lowest point", () => {
    expect(lowestSlot([0.8, 0.6, 0.1, 0.4, 0.9])).toBe(2);
  });

  test("ties go to the earliest slot", () => {
    expect(lowestSlot([0.2, 0.2, 0.9, 0.9, 0.9])).toBe(0);
  });
});

group("delta", () => {
  test("is positive when the day lifts", () => {
    expect(delta([0.2, 0.2, 0.2, 0.2, 0.2], [0.4, 0.4, 0.4, 0.4, 0.4])).toBeCloseTo(0.2, 10);
  });

  // The whole point of measuring is that it is allowed to come back bad.
  test("is negative when the day drops, and is not clamped", () => {
    expect(delta([0.8, 0.8, 0.8, 0.8, 0.8], [0.3, 0.3, 0.3, 0.3, 0.3])).toBeCloseTo(-0.5, 10);
  });

  test("is zero when nothing moved", () => {
    expect(delta(FLAT, FLAT)).toBe(0);
  });
});

group("describe", () => {
  test("names a flat heavy day", () => {
    expect(describe([0.2, 0.2, 0.2, 0.2, 0.2])).toContain("heavy");
  });

  test("names a recovery", () => {
    expect(describe([0.1, 0.2, 0.4, 0.6, 0.8])).toContain("came up");
  });

  test("names a decline", () => {
    expect(describe([0.9, 0.7, 0.5, 0.3, 0.1])).toContain("sank");
  });

  test("never returns an empty string", () => {
    for (let i = 0; i <= 10; i++) {
      const v = i / 10;
      expect(describe([v, v, v, v, v]).length).toBeGreaterThan(0);
    }
  });
});

group("colorAt", () => {
  test("clamps out-of-range input rather than producing broken hsl", () => {
    expect(colorAt(-5)).toMatch(/^hsl\(/);
    expect(colorAt(9)).toMatch(/^hsl\(/);
  });

  test("heavy is warmer than bright", () => {
    const heavyHue = Number(colorAt(0).match(/hsl\((\d+(?:\.\d+)?)/)![1]);
    const brightHue = Number(colorAt(1).match(/hsl\((\d+(?:\.\d+)?)/)![1]);
    expect(heavyHue).toBeLessThan(brightHue);
  });
});
