import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { FileValidationIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { ButtonLink } from "@/components/ui/Button";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { TagPill } from "@/components/ui/TagPill";
import { links } from "@/lib/links";
import { SectionFrame } from "./SectionFrame";

const quotes = [
  {
    text: "…the firm may discover that the initial recall should be expanded to include more batches or lots of the same recalled product than formerly reported.",
    source: "openFDA drug enforcement reports",
    why: "Why a lot that does not match today stays under review",
  },
  {
    text: "Do not rely on openFDA to make decisions regarding medical care. Always speak to your health provider about the risks and benefits of FDA-regulated products.",
    source: "openFDA drug enforcement reports",
    why: "Why a pharmacist, not the software, decides",
  },
] as const;

function Quote({ quote }: { quote: (typeof quotes)[number] }) {
  return (
    <figure className="flex h-full flex-col">
      <div className="h-px bg-ink-2" />
      <div className="pt-[2.1rem]">
        <span
          className="block h-[5.4rem] text-[4.5rem] leading-[1.2] tracking-[-0.02em] text-mute"
          aria-hidden="true"
        >
          “
        </span>
        <blockquote className="type-h6 text-white">{quote.text}</blockquote>
      </div>
      <figcaption className="mt-[3.1rem] flex flex-col">
        <span className="grid size-[3rem] place-items-center rounded-full bg-white text-ink">
          <HugeiconsIcon icon={FileValidationIcon} size={22} strokeWidth={1.5} />
        </span>
        <span className="mt-[1rem] text-white">{quote.source}</span>
        <span className="text-white/50">{quote.why}</span>
        <a
          href={links.openfdaEnforcement}
          target="_blank"
          rel="noreferrer"
          className="mt-[2rem] text-[0.875rem] font-medium tracking-[-0.01em] text-white underline-offset-4 hover:underline"
        >
          open.fda.gov ↗
        </a>
      </figcaption>
    </figure>
  );
}

export function SourceQuotes() {
  return (
    <SectionFrame divider="dark">
      <div className="flex flex-col gap-4 pt-[1.6rem] lg:flex-row">
        <div className="lg:w-[33.75rem] lg:shrink-0 lg:pr-4">
          <div className="max-w-[27rem]">
            <TagPill label="Straight from the source" />
            <h2 className="mt-8 type-large text-white">
              We built Clarilot around what the FDA’s own documentation says about its recall data.
            </h2>
            <div className="mt-8">
              <ButtonLink to={links.openfdaEnforcement} variant="outline-light">
                Read the openFDA docs
              </ButtonLink>
            </div>
          </div>
        </div>
        <div className="hidden w-px shrink-0 bg-ink-2 lg:block" />
        <Link
          to="/console"
          className="group relative isolate grid aspect-[763/429] flex-1 place-items-center overflow-hidden rounded-card"
          aria-label="Open the investigation console"
        >
          <ImageSlot
            name="console-preview"
            alt="The Clarilot investigation console"
            fallback="surface-tile"
            className="absolute inset-0 -z-10 size-full transition-transform duration-700 group-hover:scale-[1.02]"
          />
          <span className="grid size-[3.25rem] place-items-center rounded-full bg-accent text-white transition-transform duration-300 group-hover:scale-110">
            <HugeiconsIcon icon={PlayIcon} size={20} strokeWidth={1.5} />
          </span>
        </Link>
      </div>
      <div className="flex flex-col gap-4 pt-8 pb-[4rem] lg:flex-row lg:pb-[5rem]">
        <div className="lg:w-[33.75rem] lg:shrink-0 lg:pr-4">
          <div className="max-w-[27rem]">
            <Quote quote={quotes[0]} />
          </div>
        </div>
        <div className="hidden w-px shrink-0 bg-ink-2 lg:block" />
        <div className="flex-1">
          <Quote quote={quotes[1]} />
        </div>
      </div>
    </SectionFrame>
  );
}
