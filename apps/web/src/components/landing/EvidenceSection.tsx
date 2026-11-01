import { ButtonLink } from "@/components/ui/Button";
import { TagPill } from "@/components/ui/TagPill";
import { MeshDecor } from "./MeshDecor";
import { SectionFrame } from "./SectionFrame";
import { SourceCards } from "./SourceCards";

export function EvidenceSection() {
  return (
    <div id="sources" className="relative scroll-mt-24 overflow-hidden pb-[5rem]">
      <div className="pointer-events-none absolute top-0 right-0 hidden h-[54rem] w-[32.7rem] lg:block">
        <MeshDecor />
      </div>
      <SectionFrame className="relative pt-8">
        <div className="max-w-[40rem] pt-[1.6rem] pb-8">
          <TagPill label="Four sources, one statement" />
          <h2 className="mt-[4rem] type-h4 text-white">
            The evidence a recall review needs. One federated query.
          </h2>
          <p className="mt-8 type-large text-white">
            A published recall, the pharmacy’s dispensing records, its receiving ledger and FDA
            shortage status live in different systems. Clarilot asks Zetaris one question across all
            of them and shows exactly what came back, and what did not.
          </p>
          <div className="mt-8">
            <ButtonLink to="/console?view=ledger" variant="outline-light">
              See the query
            </ButtonLink>
          </div>
        </div>
      </SectionFrame>
      <div className="relative mt-[2rem]">
        <SourceCards />
      </div>
    </div>
  );
}
