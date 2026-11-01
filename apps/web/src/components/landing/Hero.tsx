import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { ButtonLink } from "@/components/ui/Button";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { ParticleText } from "./ParticleText";
import { SourceMarquee } from "./SourceMarquee";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden lg:h-[55.75rem]">
      <ImageSlot
        name="hero-texture"
        alt=""
        fallback="surface-hero"
        className="absolute inset-0 -z-10 size-full"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
      <div className="flex min-h-[38rem] flex-col justify-end px-4 pt-[19rem] sm:px-5 md:px-6 lg:h-[47.65rem] lg:min-h-0 lg:px-8 lg:pt-0">
        <div className="relative">
          <h1 className="type-hero max-w-[60rem] text-white">
            Don’t file the recall. <ParticleText text="Trace it." />
          </h1>
          <div className="mt-6 flex max-w-[25rem] flex-col gap-6 pb-4 lg:absolute lg:bottom-0 lg:left-[50.7rem] lg:mt-0 lg:pb-[1rem]">
            <p className="text-[1rem] leading-[1.2] text-white">
              Clarilot links published FDA recalls to the dispensing records a pharmacist needs to
              review.
            </p>
            <div className="flex flex-wrap gap-4">
              <ButtonLink to="/console" arrow>
                Open the console
              </ButtonLink>
              <ButtonLink
                to="#system"
                variant="outline-light"
                icon={<HugeiconsIcon icon={ArrowDown01Icon} size={12} strokeWidth={1.5} />}
              >
                See how it works
              </ButtonLink>
            </div>
          </div>
        </div>
        <div className="pt-[1.5rem]">
          <div className="h-px bg-white/50" />
        </div>
      </div>
      <SourceMarquee />
    </section>
  );
}
