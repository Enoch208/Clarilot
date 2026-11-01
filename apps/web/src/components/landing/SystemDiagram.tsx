import { useId } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Database01Icon, FileValidationIcon, FlowConnectionIcon } from "@hugeicons/core-free-icons";
import { useReducedMotion } from "motion/react";
import {
  cx,
  cy,
  diagramHeight,
  diagramWidth,
  flowParticles,
  linePaths,
  pct,
  ringArcs,
  ringTurnPerStep,
  stepPoint,
  vertexRadius,
  vertices,
} from "./system-geometry";
import { systemSteps } from "./system-steps";

const hubs = [
  { label: "Zetaris", icon: FlowConnectionIcon, tone: "bg-periwinkle", left: 50, top: 33.5 },
  { label: "Pharmacy", icon: Database01Icon, tone: "bg-accent", left: 28, top: 54 },
  { label: "openFDA", icon: FileValidationIcon, tone: "bg-amber", left: 72, top: 54 },
];

const pivot = `${String(cx)}px ${String(cy)}px`;

function Ring({ active }: { active: number }) {
  const id = useId();
  return (
    <g
      className="transition-transform duration-600 ease-[ease] motion-reduce:transition-none"
      style={{
        transform: `rotate(${String(active * ringTurnPerStep)}deg)`,
        transformOrigin: pivot,
      }}
    >
      <defs>
        {ringArcs.map((arc, index) => (
          <linearGradient
            key={arc.d}
            id={`${id}-arc-${String(index)}`}
            gradientUnits="userSpaceOnUse"
            x1={arc.start.x}
            y1={arc.start.y}
            x2={arc.end.x}
            y2={arc.end.y}
          >
            <stop offset="0%" style={{ stopColor: "var(--color-ink)", stopOpacity: 0 }} />
            <stop offset="100%" style={{ stopColor: "var(--color-mute)", stopOpacity: 0.7 }} />
          </linearGradient>
        ))}
      </defs>
      <g className="animate-orbit" style={{ transformOrigin: pivot }}>
        {ringArcs.map((arc, index) => (
          <path
            key={arc.d}
            d={arc.d}
            stroke={`url(#${id}-arc-${String(index)})`}
            strokeLinecap="round"
          />
        ))}
      </g>
    </g>
  );
}

function Flow() {
  return flowParticles.map((particle) => (
    <circle key={particle.key} r={2} className={particle.tone} opacity={0}>
      <animateMotion
        dur={`${String(particle.duration)}s`}
        begin={`${particle.delay.toFixed(2)}s`}
        repeatCount="indefinite"
        path={particle.path}
      />
      <animate
        attributeName="opacity"
        values="0;1;1;0"
        keyTimes="0;0.15;0.85;1"
        dur={`${String(particle.duration)}s`}
        begin={`${particle.delay.toFixed(2)}s`}
        repeatCount="indefinite"
      />
    </circle>
  ));
}

export function SystemDiagram({ active }: { active: number }) {
  const reduceMotion = useReducedMotion() === true;
  return (
    <div className="relative aspect-[466/477] w-full max-w-[27.4rem]">
      <svg
        viewBox={`0 0 ${String(diagramWidth)} ${String(diagramHeight)}`}
        className="absolute inset-0 size-full overflow-visible"
        fill="none"
        aria-hidden="true"
      >
        <Ring active={active} />
        <circle cx={cx} cy={cy} r={vertexRadius} className="stroke-white/25" />
        {linePaths.map((path) => (
          <path key={path} d={path} className="stroke-white/25" />
        ))}
        {vertices.map((vertex) => (
          <circle
            key={`${String(vertex.x)}-${String(vertex.y)}`}
            cx={vertex.x}
            cy={vertex.y}
            r={3}
            className="fill-white/35"
          />
        ))}
        {reduceMotion ? null : <Flow />}
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
        const at = stepPoint(index);
        const isActive = index === active;
        return (
          <div
            key={step.title}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: pct(at.x, diagramWidth), top: pct(at.y, diagramHeight) }}
          >
            <span
              aria-hidden={!isActive}
              className={`glass absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-pill border-white/40 bg-black/30 px-2 py-1 text-[0.75rem] leading-none whitespace-nowrap text-white transition-opacity duration-300 ease-[ease] ${isActive ? "opacity-100" : "opacity-0"}`}
            >
              <span className="mr-1 text-white/60">{String(index + 1).padStart(2, "0")}</span>
              {step.title}
            </span>
            <span
              className={`grid size-[2.5rem] place-items-center rounded-full border text-white transition-colors duration-300 ease-[ease] ${
                isActive ? "border-accent bg-accent" : "border-white/35 bg-ink"
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
