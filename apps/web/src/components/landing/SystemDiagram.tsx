import { HugeiconsIcon } from "@hugeicons/react";
import { Database01Icon, FileValidationIcon, FlowConnectionIcon } from "@hugeicons/core-free-icons";
import { useReducedMotion } from "motion/react";
import { systemSteps } from "./system-steps";

const width = 466;
const height = 477;
const cx = width / 2;
const cy = height / 2;
const outer = 214;
const inner = 168;

function point(radius: number, index: number) {
  const angle = ((-90 + index * 72) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

const vertices = [0, 1, 2, 3, 4].map((index) => point(inner, index));
const star = vertices.map((start, index) => {
  const end = vertices[(index + 2) % 5] ?? start;
  return `M${start.x.toFixed(1)} ${start.y.toFixed(1)}L${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
});
const petals = vertices.map((start, index) => {
  const end = vertices[(index + 1) % 5] ?? start;
  return `M${start.x.toFixed(1)} ${start.y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
});
const circumference = 2 * Math.PI * outer;
const gap = circumference * 0.06;
const arc = circumference / 5 - gap;
const particles = [
  { path: star[0] ?? "", tone: "fill-amber", duration: 7 },
  { path: star[2] ?? "", tone: "fill-periwinkle", duration: 9 },
  { path: star[3] ?? "", tone: "fill-accent", duration: 8 },
  { path: petals[1] ?? "", tone: "fill-amber", duration: 6 },
  { path: petals[4] ?? "", tone: "fill-periwinkle", duration: 10 },
];

const hubs = [
  { label: "Zetaris", icon: FlowConnectionIcon, tone: "bg-periwinkle", left: 50, top: 33.5 },
  { label: "Pharmacy", icon: Database01Icon, tone: "bg-accent", left: 28, top: 54 },
  { label: "openFDA", icon: FileValidationIcon, tone: "bg-amber", left: 72, top: 54 },
];

function pct(value: number, total: number) {
  return `${((value / total) * 100).toFixed(2)}%`;
}

export function SystemDiagram({ active }: { active: number }) {
  const reduceMotion = useReducedMotion() === true;
  return (
    <div className="relative aspect-[466/477] w-full max-w-[27.4rem]">
      <svg
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        className="absolute inset-0 size-full"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx={cx}
          cy={cy}
          r={outer}
          className="stroke-white/35"
          strokeDasharray={`${arc.toFixed(1)} ${gap.toFixed(1)}`}
          strokeDashoffset={(circumference * 0.05 - gap / 2).toFixed(1)}
        />
        <circle cx={cx} cy={cy} r={inner} className="stroke-white/25" />
        <circle
          cx={cx}
          cy={cy}
          r={inner * 0.62}
          className="stroke-white/20"
          strokeDasharray="2 5"
        />
        {star.map((path) => (
          <path key={path} d={path} className="stroke-white/30" />
        ))}
        {petals.map((path) => (
          <path key={path} d={path} className="stroke-white/20" />
        ))}
        {vertices.map((vertex) => (
          <circle
            key={`${String(vertex.x)}-${String(vertex.y)}`}
            cx={vertex.x}
            cy={vertex.y}
            r={3}
            className="fill-white/60"
          />
        ))}
        {reduceMotion
          ? null
          : particles.map((particle) => (
              <circle key={particle.path} r={2.2} className={particle.tone}>
                <animateMotion
                  dur={`${String(particle.duration)}s`}
                  repeatCount="indefinite"
                  path={particle.path}
                />
              </circle>
            ))}
      </svg>
      {hubs.map((hub) => (
        <div
          key={hub.label}
          className="glass absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-pill border-white/40 bg-black/25 py-[0.3rem] pr-2 pl-[0.3rem] text-[0.75rem] leading-none text-white"
          style={{ left: `${String(hub.left)}%`, top: `${String(hub.top)}%` }}
        >
          <span
            className={`grid size-[1.1rem] place-items-center rounded-full ${hub.tone} text-ink`}
          >
            <HugeiconsIcon icon={hub.icon} size={11} strokeWidth={1.8} />
          </span>
          {hub.label}
        </div>
      ))}
      {systemSteps.map((step, index) => {
        const at = point(outer, index);
        const isActive = index === active;
        return (
          <div
            key={step.title}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: pct(at.x, width), top: pct(at.y, height) }}
          >
            {isActive ? (
              <span className="glass absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-pill border-white/40 bg-black/30 px-2 py-1 text-[0.75rem] leading-none whitespace-nowrap text-white">
                <span className="mr-1 text-white/60">{String(index + 1).padStart(2, "0")}</span>
                {step.title}
              </span>
            ) : null}
            <span
              className={`grid size-[2.5rem] place-items-center rounded-full border transition-colors duration-500 ${
                isActive
                  ? "border-accent bg-accent text-white"
                  : "border-white/35 bg-black/30 text-white"
              }`}
            >
              <HugeiconsIcon icon={step.icon} size={17} strokeWidth={1.5} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
