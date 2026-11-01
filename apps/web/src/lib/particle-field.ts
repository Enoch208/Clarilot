export type Dot = { x: number; y: number; hx: number; hy: number; vx: number; vy: number };

export type Field = {
  dots: Dot[];
  width: number;
  height: number;
  radius: number;
  ratio: number;
  reach: number;
};

type FieldInput = {
  text: string;
  font: string;
  letterSpacing: string;
  width: number;
  height: number;
  bleed: number;
  fontSize: number;
  ratio: number;
};

export function createField(input: FieldInput): Field {
  const scratch = document.createElement("canvas");
  scratch.width = Math.ceil(input.width);
  scratch.height = Math.ceil(input.height);
  const context = scratch.getContext("2d", { willReadFrequently: true });
  const step = Math.max(2.6, input.fontSize * 0.0265);
  const radius = step * 0.42;
  const empty = {
    dots: [],
    width: input.width,
    height: input.height,
    radius,
    ratio: input.ratio,
    reach: step * 16,
  };
  if (!context) return empty;
  context.font = input.font;
  context.letterSpacing = input.letterSpacing === "normal" ? "0px" : input.letterSpacing;
  context.textBaseline = "alphabetic";
  context.fillStyle = "#000000";
  const metrics = context.measureText(input.text);
  const baseline =
    input.bleed +
    (input.height -
      input.bleed * 2 +
      metrics.fontBoundingBoxAscent -
      metrics.fontBoundingBoxDescent) /
      2;
  context.fillText(input.text, input.bleed, baseline);
  const pixels = context.getImageData(0, 0, scratch.width, scratch.height).data;
  const dots: Dot[] = [];
  for (let y = step / 2; y < scratch.height; y += step) {
    for (let x = step / 2; x < scratch.width; x += step) {
      const alpha = pixels[(Math.floor(y) * scratch.width + Math.floor(x)) * 4 + 3] ?? 0;
      if (alpha > 110) dots.push({ x, y, hx: x, hy: y, vx: 0, vy: 0 });
    }
  }
  return { ...empty, dots };
}

export function settleField(field: Field, pointer: { x: number; y: number } | null): boolean {
  let moving = false;
  for (const dot of field.dots) {
    if (pointer) {
      const dx = dot.x - pointer.x;
      const dy = dot.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance < field.reach && distance > 0.01) {
        const push = ((field.reach - distance) / field.reach) * 1.5;
        dot.vx += (dx / distance) * push;
        dot.vy += (dy / distance) * push;
      }
    }
    dot.vx = (dot.vx + (dot.hx - dot.x) * 0.06) * 0.86;
    dot.vy = (dot.vy + (dot.hy - dot.y) * 0.06) * 0.86;
    dot.x += dot.vx;
    dot.y += dot.vy;
    if (Math.abs(dot.vx) > 0.02 || Math.abs(dot.vy) > 0.02) moving = true;
  }
  return moving;
}
