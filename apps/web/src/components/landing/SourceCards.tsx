import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { sourceCards, type SourceCard } from "./source-cards";

type CardProps = {
  card: SourceCard;
  current: string | null;
  focusable: boolean;
  onToggle: (title: string) => void;
};

function Card({ card, current, focusable, onToggle }: CardProps) {
  const active = current === card.title;
  const dimmed = current !== null && !active;
  return (
    <li
      className={`w-[15.25rem] shrink-0 transition-opacity duration-400 ease-[ease] ${dimmed ? "opacity-50" : "opacity-100"}`}
    >
      <button
        type="button"
        tabIndex={focusable ? 0 : -1}
        aria-pressed={active}
        onClick={() => {
          onToggle(card.title);
        }}
        className="flex w-full flex-col gap-[1.5rem] text-left"
      >
        <span
          className={`relative block aspect-[259/311] w-full transition-transform duration-400 ease-[ease] transform-3d motion-reduce:transition-none ${active ? "rotate-y-180" : ""}`}
        >
          <ImageSlot
            name={card.image}
            alt=""
            fallback="surface-tile"
            className="absolute inset-0 size-full rounded-tile"
          />
          <span className="absolute inset-0 flex rotate-y-180 items-center justify-center rounded-tile bg-black/50 px-[2.55rem] py-[1.7rem] text-center backface-hidden">
            <span className="type-small text-white">{card.body}</span>
          </span>
        </span>
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-4">
            <span
              className={`grid size-[2.5rem] shrink-0 place-items-center rounded-full ${card.tone}`}
            >
              <HugeiconsIcon icon={card.icon} size={18} strokeWidth={1.5} />
            </span>
            <span className="text-[1.25rem] leading-none tracking-[-0.02em] text-white">
              {card.title}
            </span>
          </span>
          <HugeiconsIcon
            icon={PlusSignIcon}
            size={14}
            strokeWidth={1.5}
            className={`text-white transition-transform duration-400 ease-[ease] ${active ? "rotate-45" : ""}`}
          />
        </span>
      </button>
    </li>
  );
}

type RowProps = {
  hidden: boolean;
  current: string | null;
  onToggle: (title: string) => void;
};

function Row({ hidden, current, onToggle }: RowProps) {
  return (
    <ul className="flex shrink-0 gap-[1.5rem] pr-[1.5rem]" aria-hidden={hidden}>
      {sourceCards.map((card) => (
        <Card
          key={card.title}
          card={card}
          current={current}
          focusable={!hidden}
          onToggle={onToggle}
        />
      ))}
    </ul>
  );
}

export function SourceCards() {
  const [current, setCurrent] = useState<string | null>(null);
  const toggle = (title: string) => {
    setCurrent((value) => (value === title ? null : title));
  };
  return (
    <div className="overflow-hidden pt-[1.7rem]">
      <div
        className={`flex w-max animate-marquee [--marquee-duration:60s] ${current === null ? "" : "[animation-play-state:paused]"}`}
      >
        <Row hidden={false} current={current} onToggle={toggle} />
        <Row hidden current={current} onToggle={toggle} />
      </div>
    </div>
  );
}
