import { freshnessResponseSchema, sourcesResponseSchema } from "@clarilot/core";
import { formatAge, formatStamp } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import { Panel } from "./Panel";

export function SourcesView({ now }: { now: number }) {
  const { resource: sources } = useResource("/api/sources", sourcesResponseSchema);
  const { resource: freshness } = useResource("/api/freshness", freshnessResponseSchema);
  return (
    <Panel title="Sources and freshness">
      <div className="flex flex-col gap-4 p-4">
        {freshness.state === "ready" ? (
          <div className="rounded-btn bg-mist p-3 text-[0.8125rem] leading-[1.45] text-ink">
            <p>{freshness.data.note}</p>
            <p className="mt-1 font-mono text-mute">
              recalls filter: {freshness.data.selectedFilters.recalls}
            </p>
            <p className="font-mono text-mute">
              shortages filter: {freshness.data.selectedFilters.shortages}
            </p>
          </div>
        ) : null}
        {freshness.state === "error" ? (
          <p className="rounded-btn bg-critical-soft p-3 text-[0.8125rem] text-critical">
            Freshness unknown: {freshness.message}
          </p>
        ) : null}
        {sources.state === "loading" ? (
          <p className="text-[0.875rem] text-mute">Loading registered sources…</p>
        ) : null}
        {sources.state === "error" ? (
          <p className="rounded-btn bg-critical-soft p-3 text-[0.875rem] text-critical">
            {sources.message}
          </p>
        ) : null}
        {sources.state === "ready" ? (
          <div className="grid gap-3 md:grid-cols-2">
            {sources.data.sources.map((source) => (
              <article
                key={source.id}
                className="flex flex-col gap-2 rounded-btn border border-line p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[1rem] text-ink">{source.label}</h3>
                  <span
                    className={`rounded-pill px-2 py-1 text-[0.72rem] leading-none ${
                      source.registration === "VERIFIED"
                        ? "bg-accent-soft text-accent"
                        : "bg-caution-soft text-caution"
                    }`}
                  >
                    {source.registration === "VERIFIED"
                      ? "Registration verified"
                      : "Registration unverified"}
                  </span>
                </div>
                <p className="font-mono text-[0.78rem] text-mute">
                  {source.kind} · {source.zetarisObject}
                  {source.synthetic ? " · synthetic" : ""}
                </p>
                <p className="text-[0.875rem] text-ink">{source.description}</p>
                <dl className="grid grid-cols-2 gap-2 text-[0.8125rem]">
                  <dt className="text-mute">Rows</dt>
                  <dd className="font-mono tabular">
                    {source.rowCount ?? "unknown"}{" "}
                    <span className="text-mute">({source.rowCountBasis})</span>
                  </dd>
                  <dt className="text-mute">Published</dt>
                  <dd className="font-mono">{source.sourcePublishedAt ?? "not applicable"}</dd>
                  <dt className="text-mute">Fetched</dt>
                  <dd className="font-mono">
                    {source.fetchedAt === null
                      ? "not fetched"
                      : `${formatStamp(source.fetchedAt)} (${formatAge(source.fetchedAt, now)})`}
                  </dd>
                  <dt className="text-mute">Cache</dt>
                  <dd className="font-mono">{source.cacheMode}</dd>
                  <dt className="text-mute">Scope</dt>
                  <dd>{source.scope}</dd>
                </dl>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
