import { ButtonLink } from "@/components/ui/Button";
import { ImageSlot } from "@/components/ui/ImageSlot";

const pills = ["Synthetic pharmacy data", "Published FDA records", "Nothing is sent"];

export function CtaSection() {
  return (
    <section className="relative px-4 pt-[8rem] text-center sm:px-5 md:px-6 lg:px-8">
      <h2 className="mx-auto max-w-[40rem] type-h2 text-white">
        Turn the next recall into a reviewed list
      </h2>
      <div className="mt-8 flex justify-center">
        <ButtonLink to="/console" arrow>
          Open the console
        </ButtonLink>
      </div>
      <ul className="mt-[3rem] flex flex-wrap justify-center gap-4">
        {pills.map((pill) => (
          <li
            key={pill}
            className="rounded-pill bg-ink-2 px-3 py-2 text-[1rem] leading-none text-white"
          >
            {pill}
          </li>
        ))}
      </ul>
      <div
        className="relative mx-auto mt-[7rem] h-[14rem] max-w-[73rem] lg:h-[21rem]"
        style={{
          maskImage: "radial-gradient(60% 90% at 50% 100%, black 55%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(60% 90% at 50% 100%, black 55%, transparent 100%)",
        }}
      >
        <ImageSlot
          name="cta-horizon"
          alt=""
          fallback="surface-horizon"
          className="absolute inset-0 size-full"
        />
      </div>
    </section>
  );
}
