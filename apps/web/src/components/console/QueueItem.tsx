import type { Alert } from "@clarilot/core";
import { classificationBadge, lotBadges } from "@/lib/evidence";
import { Badge } from "./Badge";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

type QueueItemProps = {
  alert: Alert;
  selected: boolean;
  onSelect: () => void;
};

export function QueueItem({ alert, selected, onSelect }: QueueItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className={`flex w-full flex-col gap-2 border-l-2 px-4 py-3 text-left transition-colors ${
          selected ? "border-accent bg-accent-soft/60" : "border-transparent hover:bg-mist"
        }`}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="font-mono text-[0.8125rem] text-ink tabular">
            {alert.recall.recallNumber}
          </span>
          <Badge spec={classificationBadge(alert.recall.classification)} />
        </span>
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[0.9375rem] text-ink">{alert.patient.displayName}</span>
          <span className="shrink-0 font-mono text-[0.72rem] text-mute tabular">
            dispense #{alert.dispense.dispenseId}
          </span>
        </span>
        <span className="line-clamp-1 text-[0.8125rem] text-ink/70">
          {alert.dispense.drugLabel}
        </span>
        <span className="flex flex-wrap gap-x-3 font-mono text-[0.72rem] text-mute tabular">
          <span>NDC {alert.dispense.productNdcRaw}</span>
          <span>lot {alert.dispense.lotNo ?? "missing"}</span>
        </span>
        <span className="flex flex-wrap items-center gap-2">
          <Badge spec={lotBadges[alert.lot.level]} />
          <span className="text-[0.75rem] text-mute">
            {alert.store.name} · {dateFormat.format(new Date(alert.dispense.dispensedAt))}
          </span>
        </span>
      </button>
    </li>
  );
}
