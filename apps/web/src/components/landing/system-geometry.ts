export const diagramWidth = 466;
export const diagramHeight = 477;
export const cx = diagramWidth / 2;
export const cy = diagramHeight / 2;
export const ringRadius = 214;
export const vertexRadius = 168;
export const ringTurnPerStep = 20;

type Point = { x: number; y: number };

export function polar(radius: number, degrees: number): Point {
  const angle = (degrees * Math.PI) / 180;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

function fixed(point: Point) {
  return `${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
}

export function stepPoint(index: number) {
  return polar(ringRadius, -90 + index * 72);
}

export const vertices = [0, 1, 2, 3, 4].map((index) => polar(vertexRadius, -90 + index * 72));

type Curve = { from: Point; control: Point; to: Point };

function lens(from: Point, to: Point, bulge: number): Curve {
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const nx = -(to.y - from.y) / length;
  const ny = (to.x - from.x) / length;
  return { from, to, control: { x: mid.x + nx * bulge * length, y: mid.y + ny * bulge * length } };
}

function petal(from: Point, to: Point): Curve {
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  return { from, to, control: { x: mid.x + (cx - mid.x) * 0.47, y: mid.y + (cy - mid.y) * 0.47 } };
}

function pick(index: number) {
  return vertices[(index + 5) % 5] ?? { x: cx, y: cy };
}

const curves: Curve[] = [0, 1, 2, 3, 4].flatMap((index) => [
  lens(pick(index), pick(index + 2), 0.16),
  lens(pick(index), pick(index + 2), -0.16),
  petal(pick(index), pick(index + 1)),
]);

function path(curve: Curve, reverse = false) {
  const [start, end] = reverse ? [curve.to, curve.from] : [curve.from, curve.to];
  return `M${fixed(start)}Q${fixed(curve.control)} ${fixed(end)}`;
}

export const linePaths = curves.map((curve) => path(curve));

const tones = ["fill-periwinkle", "fill-amber", "fill-accent"] as const;

export const flowParticles = curves.flatMap((curve, index) =>
  [false, true].map((reverse, lane) => {
    const order = index * 2 + lane;
    const duration = 4.5 + (order % 4) * 0.8;
    return {
      key: `${String(index)}-${String(lane)}`,
      path: path(curve, reverse),
      tone: tones[order % tones.length] ?? "fill-accent",
      duration,
      delay: -((order * 1.37) % duration),
    };
  }),
);

export const ringArcs = [0, 1, 2, 3, 4].map((index) => {
  const start = polar(ringRadius, -126 + index * 72);
  const end = polar(ringRadius, -54 + index * 72);
  return {
    start,
    end,
    d: `M${fixed(start)}A${String(ringRadius)} ${String(ringRadius)} 0 0 1 ${fixed(end)}`,
  };
});

export function pct(value: number, total: number) {
  return `${((value / total) * 100).toFixed(2)}%`;
}
