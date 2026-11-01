import { particleTuning, type Field, type Particle, type Rgb } from "./particle-field";

type SampleInput = {
  text: string;
  font: string;
  letterSpacing: string;
  width: number;
  height: number;
  tints: number;
};

const coverage = 25;

export function sampleText(input: SampleInput): Field {
  const bleed = Math.round(particleTuning.reach);
  const width = Math.ceil(input.width);
  const height = Math.ceil(input.height);
  const particles: Particle[] = [];
  const field = { particles, width: width + bleed * 2, height: height + bleed * 2, bleed };
  if (width === 0 || height === 0) return field;
  const scratch = document.createElement("canvas");
  scratch.width = width;
  scratch.height = height;
  const context = scratch.getContext("2d", { willReadFrequently: true });
  if (!context) return field;
  context.font = input.font;
  context.letterSpacing = input.letterSpacing === "normal" ? "0px" : input.letterSpacing;
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.fillStyle = "black";
  const metrics = context.measureText(input.text);
  const ascent = metrics.fontBoundingBoxAscent;
  const descent = metrics.fontBoundingBoxDescent;
  context.fillText(input.text, width / 2, (height - (ascent + descent)) / 2 + ascent);
  const data = context.getImageData(0, 0, width, height).data;
  const { gap } = particleTuning;
  for (let y = 0; y < height; y += gap) {
    for (let x = 0; x < width; x += gap) {
      let total = 0;
      let count = 0;
      for (let dy = 0; dy < gap && y + dy < height; dy += 1) {
        for (let dx = 0; dx < gap && x + dx < width; dx += 1) {
          total += data[((y + dy) * width + (x + dx)) * 4 + 3] ?? 0;
          count += 1;
        }
      }
      if (count === 0 || total / count < coverage) continue;
      const hx = x + gap / 2 + bleed;
      const hy = y + gap / 2 + bleed;
      const tint = Math.floor(Math.random() * input.tints);
      particles.push({ x: hx, y: hy, hx, hy, vx: 0, vy: 0, tint, level: 0 });
    }
  }
  return field;
}

export function toRgb(color: string): Rgb {
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return [255, 255, 255];
  probe.fillStyle = color;
  const normalised = probe.fillStyle;
  if (normalised.startsWith("#")) {
    const value = Number.parseInt(normalised.slice(1, 7), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }
  const [red = 255, green = 255, blue = 255] = (normalised.match(/\d+(\.\d+)?/g) ?? []).map(Number);
  return [red, green, blue];
}

export function glyphRadius(context: CanvasRenderingContext2D) {
  context.font = `${String(Math.max(4, particleTuning.dot * 2))}px monospace`;
  const metrics = context.measureText("●");
  const width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
  return width > 0 ? width / 2 : particleTuning.dot * 0.6;
}
