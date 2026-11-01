import { ButtonLink } from "@/components/ui/Button";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { RevealText } from "@/components/ui/RevealText";
import { TagPill } from "@/components/ui/TagPill";
import { links } from "@/lib/links";
import { SectionFrame } from "./SectionFrame";

const waveMask =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M2 0 C10 22 -2 42 6 62 C11 76 0 88 1 100 L100 100 L100 0 Z' fill='black'/%3E%3C/svg%3E\")";

export function AboutSection() {
  return (
    <SectionFrame id="about" divider="light" className="pb-[5rem]">
      <div className="pt-[1.6rem]">
        <TagPill label="About Clarilot" />
      </div>
      <div className="mt-[4rem] grid gap-8 lg:grid-cols-2 lg:gap-4">
        <RevealText
          as="h2"
          className="max-w-[34rem] type-h4 text-ink-2"
          text="Built for the pharmacist who has to answer: who received it?"
        />
        <RevealText
          className="max-w-[40rem] type-large text-ink-2"
          text="Clarilot is a prototype built for the Zetaris Demo Challenge 2026. It runs on a synthetic pharmacy and real, published FDA records. It is a review aid for pharmacists, not a validated clinical decision support device, and it never contacts a patient."
        />
      </div>
      <div className="relative isolate mt-[4rem] flex min-h-[26.25rem] overflow-hidden rounded-panel bg-petrol max-lg:flex-col">
        <div className="flex flex-col justify-center gap-4 px-6 py-10 lg:w-[54%] lg:py-[2rem] lg:pr-8 lg:pl-[6rem]">
          <h3 className="type-h5 text-white">Honest about what it does not know</h3>
          <p className="max-w-[30rem] text-white">
            Every flag shows what matched, what was inferred and what is missing. When a source is
            down or stale, the console says so instead of showing an empty list.
          </p>
          <div className="mt-2">
            <ButtonLink to={links.repo} variant="outline-light">
              Read the safety boundary
            </ButtonLink>
          </div>
        </div>
        <div
          className="relative min-h-[18rem] flex-1 lg:-ml-[3rem]"
          style={{
            maskImage: waveMask,
            WebkitMaskImage: waveMask,
            maskSize: "100% 100%",
            WebkitMaskSize: "100% 100%",
          }}
        >
          <ImageSlot
            name="about-pharmacist"
            alt="A pharmacist reviewing records at a dispensary counter"
            fallback="surface-hero"
            className="absolute inset-0 size-full"
          />
        </div>
      </div>
    </SectionFrame>
  );
}
