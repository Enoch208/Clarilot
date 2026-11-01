import { useRef, useState, type MouseEvent } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  CodeIcon,
  DashboardSquare01Icon,
  TaskDone01Icon,
} from "@hugeicons/core-free-icons";
import { m, useSpring } from "motion/react";
import { Link } from "react-router";

type Cta = { title: string; detail: string; icon: IconSvgElement };

const ctas: readonly Cta[] = [
  {
    title: "Open the console",
    detail: "Real FDA recalls, synthetic pharmacy",
    icon: DashboardSquare01Icon,
  },
  {
    title: "Walk the review queue",
    detail: "Every case shows its evidence level",
    icon: TaskDone01Icon,
  },
  {
    title: "Read the federated query",
    detail: "The SQL behind every result",
    icon: CodeIcon,
  },
];

const travelRem = 8;
const follow = { stiffness: 140, damping: 24, mass: 0.6 };
const pop = { duration: 0.3, ease: [0.33, 1, 0.68, 1] as const };

function nextIndex(previous: number) {
  const offset = 1 + Math.floor(Math.random() * (ctas.length - 1));
  return (previous + offset) % ctas.length;
}

export function CursorCta({ to }: { to: string }) {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const remRef = useRef(16);
  const x = useSpring(0, follow);
  const y = useSpring(0, follow);
  const cta = ctas[index] ?? ctas[0];
  if (!cta) return null;

  const enter = () => {
    remRef.current = parseFloat(getComputedStyle(document.documentElement).fontSize);
    setIndex(nextIndex);
    setShown(true);
  };

  const track = (event: MouseEvent<HTMLAnchorElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const travel = travelRem * remRef.current;
    x.set(((event.clientX - box.left) / box.width - 0.5) * 2 * travel);
    y.set(((event.clientY - box.top) / box.height - 0.5) * 2 * travel);
  };

  const leave = () => {
    setShown(false);
  };

  return (
    <Link
      to={to}
      aria-label={`${cta.title}: ${cta.detail}`}
      onMouseEnter={enter}
      onMouseMove={track}
      onMouseLeave={leave}
      onFocus={() => {
        setShown(true);
      }}
      onBlur={leave}
      className="absolute inset-0 grid place-items-center focus-visible:outline-offset-[-4px]"
    >
      <m.span
        aria-hidden="true"
        style={{ x, y }}
        initial={false}
        animate={shown ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={pop}
        className="pointer-events-none flex items-center gap-[0.9rem] rounded-pill bg-petrol py-[0.6rem] pr-[1.4rem] pl-[0.6rem] text-white shadow-[0_0.5rem_2rem_rgb(0_0_0/0.25)]"
      >
        <span className="grid size-[3.5rem] shrink-0 place-items-center rounded-full bg-accent">
          <HugeiconsIcon icon={cta.icon} size={22} strokeWidth={1.5} />
        </span>
        <span className="flex flex-col gap-[0.2rem] whitespace-nowrap">
          <span className="text-[1.5rem] leading-[1.1] tracking-[-0.02em]">{cta.title}</span>
          <span className="text-[1rem] leading-[1.2] text-white/75">{cta.detail}</span>
        </span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={18}
          strokeWidth={1.5}
          className="ml-[0.6rem]"
        />
      </m.span>
    </Link>
  );
}
