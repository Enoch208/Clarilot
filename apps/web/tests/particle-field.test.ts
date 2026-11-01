import { describe, expect, it } from "vitest";
import {
  buildPalette,
  paletteKey,
  particleTuning,
  stepField,
  type Field,
  type FieldPointer,
} from "../src/lib/particle-field";

function fieldAt(x: number, y: number, tint = 0): Field {
  return {
    particles: [{ x, y, hx: x, hy: y, vx: 0, vy: 0, tint, level: 0 }],
    width: 200,
    height: 200,
    bleed: 54,
  };
}

const away: FieldPointer = { x: -9999, y: -9999, vx: 0, vy: 0, moving: false, present: false };

describe("stepField", () => {
  it("leaves a settled field idle when the pointer is away", () => {
    const field = fieldAt(100, 100);
    expect(stepField(field, away)).toBe(false);
    expect(field.particles[0]?.level).toBe(0);
  });

  it("does not push dots while the pointer rests, only tints them", () => {
    const field = fieldAt(100, 100);
    const resting = { x: 110, y: 100, vx: 0, vy: 0, moving: false, present: true };
    expect(stepField(field, resting)).toBe(true);
    expect(field.particles[0]?.x).toBe(100);
    expect(field.particles[0]?.level).toBeGreaterThan(0);
  });

  it("pushes harder when the pointer moves faster", () => {
    const slow = fieldAt(100, 100);
    const fast = fieldAt(100, 100);
    stepField(slow, { x: 90, y: 100, vx: 2, vy: 0, moving: true, present: true });
    stepField(fast, { x: 90, y: 100, vx: 20, vy: 0, moving: true, present: true });
    const slowShift = (slow.particles[0]?.x ?? 0) - 100;
    const fastShift = (fast.particles[0]?.x ?? 0) - 100;
    expect(slowShift).toBeGreaterThan(0);
    expect(fastShift).toBeGreaterThan(slowShift);
  });

  it("springs a displaced dot back home", () => {
    const field = fieldAt(100, 100);
    const particle = field.particles[0];
    if (!particle) throw new Error("missing particle");
    particle.x = 130;
    for (let frame = 0; frame < 600; frame += 1) stepField(field, away);
    expect(Math.abs(particle.x - 100)).toBeLessThan(particleTuning.rest);
    expect(stepField(field, away)).toBe(false);
  });
});

describe("buildPalette", () => {
  it("starts at the ink colour and ends each tint at full strength", () => {
    const palette = buildPalette(
      [255, 255, 255],
      [
        [0, 0, 0],
        [10, 129, 116],
      ],
    );
    expect(palette).toHaveLength(1 + 2 * particleTuning.levels);
    expect(palette[0]).toBe("rgb(255,255,255)");
    expect(palette[particleTuning.levels]).toBe("rgb(0,0,0)");
    expect(palette[2 * particleTuning.levels]).toBe("rgb(10,129,116)");
  });

  it("maps a particle to its tint and level", () => {
    const base = { x: 0, y: 0, hx: 0, hy: 0, vx: 0, vy: 0 };
    expect(paletteKey({ ...base, tint: 1, level: 0 })).toBe(0);
    expect(paletteKey({ ...base, tint: 1, level: 3 })).toBe(1 + particleTuning.levels + 2);
  });
});
