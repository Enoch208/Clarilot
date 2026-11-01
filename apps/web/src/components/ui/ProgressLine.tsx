import { m, useReducedMotion } from "motion/react";

type ProgressLineProps = {
  active: boolean;
  round: number;
  durationMs: number;
  base: string;
};

export function ProgressLine({ active, round, durationMs, base }: ProgressLineProps) {
  const reduceMotion = useReducedMotion() === true;
  return (
    <div className={`relative h-px w-full ${base}`}>
      {active ? (
        <m.div
          key={round}
          className="absolute inset-y-0 left-0 bg-accent"
          initial={{ width: reduceMotion ? "100%" : "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: reduceMotion ? 0 : durationMs / 1000, ease: "linear" }}
        />
      ) : null}
    </div>
  );
}
