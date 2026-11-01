import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ChartLineData01Icon,
  Csv01Icon,
  Database01Icon,
  FileValidationIcon,
  FlowConnectionIcon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons";

const marks: readonly { label: string; icon: IconSvgElement }[] = [
  { label: "PostgreSQL", icon: Database01Icon },
  { label: "openFDA Enforcement", icon: FileValidationIcon },
  { label: "Zetaris", icon: FlowConnectionIcon },
  { label: "openFDA Shortages", icon: ChartLineData01Icon },
  { label: "Receiving ledger", icon: Csv01Icon },
  { label: "Query ledger", icon: SecurityCheckIcon },
];

function MarkRow({ hidden }: { hidden: boolean }) {
  return (
    <ul className="flex shrink-0 items-center gap-[5.5rem] pr-[5.5rem]" aria-hidden={hidden}>
      {marks.map((mark) => (
        <li
          key={mark.label}
          className="flex items-center gap-2 text-[1.45rem] font-medium tracking-[-0.03em] whitespace-nowrap text-white"
        >
          <HugeiconsIcon icon={mark.icon} size={26} strokeWidth={1.6} />
          {mark.label}
        </li>
      ))}
    </ul>
  );
}

export function SourceMarquee() {
  return (
    <div className="relative flex h-[5.5rem] items-center overflow-hidden lg:h-[8.1rem]">
      <p className="sr-only">
        Sources queried together: PostgreSQL, openFDA enforcement reports, openFDA drug shortages
        and a receiving ledger, through Zetaris, with every execution in a query ledger.
      </p>
      <div className="flex w-max animate-marquee [--marquee-duration:32s]">
        <MarkRow hidden={false} />
        <MarkRow hidden />
      </div>
    </div>
  );
}
