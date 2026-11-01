import { useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { ButtonLink } from "@/components/ui/Button";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { ProgressLine } from "@/components/ui/ProgressLine";
import { TagPill } from "@/components/ui/TagPill";
import { useCycle } from "@/lib/use-cycle";
import { SectionFrame } from "./SectionFrame";
import { SystemDiagram } from "./SystemDiagram";
import { systemSteps } from "./system-steps";

const period = 8000;

export function SystemSection() {
  const [hovering, setHovering] = useState(false);
  const { index, round, select } = useCycle(systemSteps.length, period, hovering);
  return (
    <SectionFrame id="system" className="pt-8">
      <div className="flex flex-col gap-4 pt-[1.6rem] pb-8 lg:flex-row">
        <div className="flex flex-col lg:w-[33.75rem] lg:shrink-0 lg:pr-4">
          <div className="max-w-[27rem]">
            <TagPill label="The Clarilot system" />
            <h2 className="mt-[3.2rem] type-h5 text-white">
              Recall response needs more than a search box
            </h2>
            <div className="mt-6">
              <ButtonLink to="/console" variant="outline-light">
                Open the console
              </ButtonLink>
            </div>
          </div>
          <div
            className="mt-[6rem] max-w-[27rem]"
            onMouseEnter={() => {
              setHovering(true);
            }}
            onMouseLeave={() => {
              setHovering(false);
            }}
          >
            {systemSteps.map((step, stepIndex) => {
              const isActive = stepIndex === index;
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => {
                    select(stepIndex);
                  }}
                  className={`block w-full text-left transition-colors ${isActive ? "text-white" : "text-mute hover:text-white/80"}`}
                  aria-expanded={isActive}
                >
                  <ProgressLine
                    active={isActive}
                    round={round}
                    durationMs={period}
                    base="bg-ink-2"
                  />
                  <span className="flex flex-col gap-4 pt-[0.75rem] pb-[1.25rem]">
                    <span className="flex gap-2 text-[0.75rem] leading-[1.2] font-normal">
                      <span className="tabular">{String(stepIndex + 1).padStart(2, "0")}</span>
                      <span>{step.title}</span>
                    </span>
                    <AnimatePresence initial={false}>
                      {isActive ? (
                        <m.span
                          key="body"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                          className="block overflow-hidden text-[1.25rem] leading-[1.5] tracking-[-0.02em] max-sm:text-[1.125rem]"
                        >
                          {step.body}
                        </m.span>
                      ) : null}
                    </AnimatePresence>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="hidden w-px shrink-0 bg-ink-2 lg:block" />
        <div className="relative isolate flex min-h-[26rem] flex-1 items-center justify-center overflow-hidden rounded-card lg:ml-px lg:min-h-[47.5rem]">
          <ImageSlot
            name="system-backdrop"
            alt=""
            fallback="surface-deep"
            className="absolute inset-0 -z-10 size-full"
          />
          <div className="w-[82%] max-w-[27.4rem] py-10">
            <SystemDiagram active={index} />
          </div>
        </div>
      </div>
    </SectionFrame>
  );
}
