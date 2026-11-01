import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { sourceCards, type SourceCard } from "./source-cards";

function Card({ card }: { card: SourceCard }) {
  return (
    <li className="group flex w-[15.25rem] shrink-0 flex-col gap-[1.5rem]">
      <div className="relative aspect-[259/311] overflow-hidden rounded-tile">
        <ImageSlot
          name={card.image}
          alt=""
          fallback="surface-tile"
          className="absolute inset-0 size-full"
        />
        <div className="absolute inset-0 flex items-center rounded-tile bg-black/50 px-[2.55rem] py-[1.7rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <p className="type-small text-white">{card.body}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <span
            className={`grid size-[2.5rem] shrink-0 place-items-center rounded-full ${card.tone}`}
          >
            <HugeiconsIcon icon={card.icon} size={18} strokeWidth={1.5} />
          </span>
          <h3 className="text-[1.25rem] leading-none tracking-[-0.02em] text-white">
            {card.title}
          </h3>
        </div>
        <HugeiconsIcon
          icon={PlusSignIcon}
          size={14}
          strokeWidth={1.5}
          className="text-white transition-transform duration-300 group-hover:rotate-45"
        />
      </div>
    </li>
  );
}

function Row({ hidden }: { hidden: boolean }) {
  return (
    <ul className="flex shrink-0 gap-[1.5rem] pr-[1.5rem]" aria-hidden={hidden}>
      {sourceCards.map((card) => (
        <Card key={card.title} card={card} />
      ))}
    </ul>
  );
}

export function SourceCards() {
  return (
    <div className="overflow-hidden pt-[1.7rem]">
      <div className="flex w-max animate-marquee hover-pause [--marquee-duration:45s]">
        <Row hidden={false} />
        <Row hidden />
      </div>
    </div>
  );
}
