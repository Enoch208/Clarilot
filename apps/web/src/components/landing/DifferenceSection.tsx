import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  FlowConnectionIcon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";
import { AnimatePresence, m } from "motion/react";
import { Link } from "react-router";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { ProgressLine } from "@/components/ui/ProgressLine";
import { TagPill } from "@/components/ui/TagPill";
import type { ImageName } from "@/lib/images";
import { useCycle } from "@/lib/use-cycle";
import { SectionFrame } from "./SectionFrame";

type Tab = {
  chip: string;
  title: string;
  body: string;
  link: string;
  icon: IconSvgElement;
  tone: string;
  image: ImageName;
};

const tabs: readonly Tab[] = [
  {
    chip: "Federation",
    title: "Federated, not copied",
    body: "Zetaris queries the pharmacy database, the receiving ledger and both FDA feeds where they live. Add a dispense in Postgres, rerun the same SQL, and the new case appears.",
    link: "/console?view=ledger",
    icon: FlowConnectionIcon,
    tone: "bg-periwinkle",
    image: "console-federation",
  },
  {
    chip: "Evidence",
    title: "Conservative by design",
    body: "An exact lot match, an explicit all-lots scope and an unknown lot get different labels. Unknown is never shown as clear, and a source that is down is never shown as zero.",
    link: "/console",
    icon: CheckmarkCircle02Icon,
    tone: "bg-amber",
    image: "console-evidence",
  },
  {
    chip: "Review",
    title: "A pharmacist decides",
    body: "Clarilot prepares a draft grounded in the source row. A pharmacist approves or rejects it, and that decision is recorded. No message is sent by the software.",
    link: "/console",
    icon: UserCheck01Icon,
    tone: "bg-accent",
    image: "console-review",
  },
];

const period = 20000;

export function DifferenceSection() {
  const { index, round, select } = useCycle(tabs.length, period, false);
  const current = tabs[index] ?? tabs[0];
  if (!current) return null;
  return (
    <SectionFrame id="difference" className="pb-[5rem]">
      <div className="pt-[1.6rem]">
        <TagPill label="The Clarilot difference" />
        <h2 className="mt-[4rem] max-w-[38rem] type-h4 text-white">
          Built to say “review needed” when the evidence is thin
        </h2>
      </div>
      <div className="relative isolate mt-[4rem] aspect-[1372/686] overflow-hidden rounded-card max-md:aspect-[4/3]">
        <AnimatePresence initial={false}>
          <m.div
            key={current.image}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ImageSlot
              name={current.image}
              alt={current.title}
              fallback="surface-tile"
              className="size-full"
            />
          </m.div>
        </AnimatePresence>
        <div className="glass absolute top-[1.25rem] left-[1.25rem] flex items-center gap-1.5 rounded-pill py-[0.375rem] pr-2 pl-[0.375rem] text-[1rem] leading-none text-white">
          <span
            className={`grid size-[1.4rem] place-items-center rounded-full ${current.tone} text-ink`}
          >
            <HugeiconsIcon icon={current.icon} size={13} strokeWidth={1.8} />
          </span>
          {current.chip}
        </div>
      </div>
      <div className="mt-[3rem] grid gap-4 md:grid-cols-3">
        {tabs.map((tab, tabIndex) => {
          const isActive = tabIndex === index;
          return (
            <div
              key={tab.title}
              className={`flex flex-col gap-4 transition-colors ${isActive ? "text-white" : "text-mute hover:text-white/80"}`}
            >
              <button
                type="button"
                onClick={() => {
                  select(tabIndex);
                }}
                className="flex flex-col gap-4 text-left"
                aria-pressed={isActive}
              >
                <ProgressLine
                  active={isActive}
                  round={round}
                  durationMs={period}
                  base="bg-line/30"
                />
                <span className="flex flex-col gap-2 pt-2">
                  <span className="text-[1rem] leading-[1.2] font-normal">{tab.title}</span>
                  <span className="text-[1rem] leading-[1.2]">{tab.body}</span>
                </span>
              </button>
              <Link to={tab.link} className="self-start text-[1rem] underline underline-offset-4">
                Learn more
              </Link>
            </div>
          );
        })}
      </div>
    </SectionFrame>
  );
}
