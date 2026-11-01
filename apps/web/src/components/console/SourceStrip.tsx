import type { ComponentHealth, HealthResponse } from "@clarilot/core";
import { healthBadges, toneDots } from "@/lib/evidence";
import { formatAge } from "@/lib/format";
import type { Resource } from "@/lib/use-resource";

type Chip = { name: string; health: ComponentHealth; detail: string };

function chips(health: HealthResponse, now: number): Chip[] {
  const fetched = (iso: string | null) =>
    iso === null ? "never fetched" : `fetched ${formatAge(iso, now)}`;
  return [
    {
      name: "Zetaris",
      health: health.zetaris,
      detail: health.zetaris.version ?? health.zetaris.detail,
    },
    {
      name: "Pharmacy Postgres",
      health: health.pharmacy,
      detail:
        health.pharmacy.dispensingRows === null
          ? health.pharmacy.detail
          : `${String(health.pharmacy.dispensingRows)} dispensing rows`,
    },
    {
      name: "openFDA recalls",
      health: health.recalls,
      detail: `published ${health.recalls.sourcePublishedAt ?? "unknown"} · ${fetched(health.recalls.fetchedAt)}`,
    },
    {
      name: "openFDA shortages",
      health: health.shortages,
      detail: `published ${health.shortages.sourcePublishedAt ?? "unknown"} · ${fetched(health.shortages.fetchedAt)}`,
    },
    {
      name: "Receiving CSV",
      health: health.receiving,
      detail:
        health.receiving.rowCount === null
          ? health.receiving.detail
          : `${String(health.receiving.rowCount)} rows`,
    },
  ];
}

type SourceStripProps = {
  health: Resource<HealthResponse>;
  now: number;
};

export function SourceStrip({ health, now }: SourceStripProps) {
  if (health.state === "loading") {
    return <p className="px-1 text-[0.875rem] text-mute">Checking source health…</p>;
  }
  if (health.state === "error") {
    return (
      <p className="rounded-btn bg-critical-soft px-3 py-2 text-[0.875rem] text-critical">
        Source health is unknown: {health.message}. Results below cannot be treated as verified.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {chips(health.data, now).map((chip) => {
        const spec = healthBadges[chip.health.status];
        return (
          <div
            key={chip.name}
            className="flex min-w-0 items-start gap-2 rounded-btn border border-line bg-white px-3 py-2"
            title={chip.health.detail}
          >
            <span
              className={`mt-[0.4rem] size-2 shrink-0 rounded-full ${toneDots[spec.tone]}`}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-[0.8125rem] leading-[1.2] text-ink">
                {chip.name} <span className="text-mute">· {spec.label}</span>
              </p>
              <p className="max-w-[12.5rem] truncate font-mono text-[0.72rem] leading-[1.4] text-mute">
                {chip.detail}
              </p>
            </div>
          </div>
        );
      })}
      <div className="flex items-center rounded-btn px-2 text-[0.75rem] leading-tight text-mute">
        {health.data.verificationReady ? "All sources checked" : "Verification not ready"}
        <br />
        checked {formatAge(health.data.checkedAt, now)}
      </div>
    </div>
  );
}
