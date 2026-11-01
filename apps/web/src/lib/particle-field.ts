export type Rgb = readonly [number, number, number];

export type Particle = {
  x: number;
  y: number;
  hx: number;
  hy: number;
  vx: number;
  vy: number;
  tint: number;
  level: number;
};

export type Field = {
  particles: Particle[];
  width: number;
  height: number;
  bleed: number;
};

export type FieldPointer = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  moving: boolean;
  present: boolean;
};

export const particleTuning = {
  gap: 3,
  dot: 2.2,
  reach: 30 + (1 / 9) * 220,
  force: 0.06 + (0.5 / 9) * 0.54,
  spring: 0.015,
  damping: 0.48 + (6 / 9) * 0.44,
  colorAt: 20,
  maxPush: 50,
  levels: 8,
  rest: 0.05,
} as const;

export function stepField(field: Field, pointer: FieldPointer): boolean {
  const { reach, force, spring, damping, colorAt, maxPush, levels, rest } = particleTuning;
  const push = Math.min(Math.hypot(pointer.vx, pointer.vy) * force, maxPush);
  let busy = false;
  for (const particle of field.particles) {
    const dx = particle.x - pointer.x;
    const dy = particle.y - pointer.y;
    const distance = Math.hypot(dx, dy);
    if (pointer.moving && distance < reach && distance > 0) {
      const magnitude = ((reach - distance) / reach) * push;
      particle.vx += (dx / distance) * magnitude;
      particle.vy += (dy / distance) * magnitude;
    }
    particle.vx = (particle.vx + (particle.hx - particle.x) * spring) * damping;
    particle.vy = (particle.vy + (particle.hy - particle.y) * spring) * damping;
    particle.x += particle.vx;
    particle.y += particle.vy;
    const displacement = Math.hypot(particle.x - particle.hx, particle.y - particle.hy);
    const near = pointer.present
      ? Math.max(0, 1 - Math.hypot(particle.x - pointer.x, particle.y - pointer.y) / reach)
      : 0;
    const tint = Math.max(Math.min(displacement / colorAt, 1), near);
    particle.level = Math.round(tint * levels);
    if (displacement > rest || particle.level > 0) busy = true;
  }
  return busy;
}

export function paletteKey(particle: Particle) {
  if (particle.level === 0) return 0;
  return 1 + particle.tint * particleTuning.levels + particle.level - 1;
}

export function buildPalette(ink: Rgb, tints: readonly Rgb[]): string[] {
  const css = (rgb: Rgb) => `rgb(${rgb.map((value) => String(Math.round(value))).join(",")})`;
  const palette = [css(ink)];
  for (const tint of tints) {
    for (let level = 1; level <= particleTuning.levels; level += 1) {
      const share = level / particleTuning.levels;
      palette.push(
        css([
          ink[0] + (tint[0] - ink[0]) * share,
          ink[1] + (tint[1] - ink[1]) * share,
          ink[2] + (tint[2] - ink[2]) * share,
        ]),
      );
    }
  }
  return palette;
}

export function drawField(
  context: CanvasRenderingContext2D,
  field: Field,
  palette: readonly string[],
  radius: number,
) {
  const groups: Particle[][] = palette.map(() => []);
  for (const particle of field.particles) groups[paletteKey(particle)]?.push(particle);
  context.clearRect(0, 0, field.width, field.height);
  groups.forEach((group, key) => {
    if (group.length === 0) return;
    context.fillStyle = palette[key] ?? palette[0] ?? "white";
    context.beginPath();
    for (const particle of group) {
      context.moveTo(particle.x + radius, particle.y);
      context.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    }
    context.fill();
  });
}
