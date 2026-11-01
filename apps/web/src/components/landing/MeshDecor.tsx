const capsules = [
  { x: 120, y: 120, w: 260, h: 110, r: -28 },
  { x: 260, y: 260, w: 300, h: 120, r: 18 },
  { x: 90, y: 420, w: 220, h: 96, r: 62 },
  { x: 300, y: 520, w: 280, h: 110, r: -40 },
  { x: 160, y: 700, w: 240, h: 104, r: 12 },
];

export function MeshDecor() {
  return (
    <svg viewBox="0 0 556 922" fill="none" className="size-full" aria-hidden="true">
      {capsules.map((capsule) => {
        const transform = `rotate(${String(capsule.r)} ${String(capsule.x + capsule.w / 2)} ${String(capsule.y + capsule.h / 2)})`;
        const rx = capsule.h / 2;
        return (
          <g
            key={`${String(capsule.x)}-${String(capsule.y)}`}
            transform={transform}
            className="stroke-white/14"
          >
            <rect x={capsule.x} y={capsule.y} width={capsule.w} height={capsule.h} rx={rx} />
            <path
              d={`M${String(capsule.x + capsule.w / 2)} ${String(capsule.y)}V${String(capsule.y + capsule.h)}`}
            />
            {[0.18, 0.36, 0.64, 0.82].map((ratio) => (
              <ellipse
                key={ratio}
                cx={capsule.x + capsule.w * ratio}
                cy={capsule.y + capsule.h / 2}
                rx={capsule.w * 0.035}
                ry={capsule.h / 2}
              />
            ))}
            <ellipse
              cx={capsule.x + capsule.w / 2}
              cy={capsule.y + capsule.h / 2}
              rx={capsule.w / 2}
              ry={capsule.h * 0.18}
            />
          </g>
        );
      })}
    </svg>
  );
}
