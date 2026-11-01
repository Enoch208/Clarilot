import {
  lotEvidenceLevels,
  type Alert,
  type AlertsResponse,
  type LotEvidenceLevel,
} from "@clarilot/core";
import { lotBadges } from "@/lib/evidence";
import type { Resource } from "@/lib/use-resource";
import { Panel } from "./Panel";
import { QueryBanner } from "./QueryBanner";
import { QueueItem } from "./QueueItem";
import { applyFilters, distinct, type QueueFilters } from "./queue-filters";

type QueueProps = {
  alerts: Resource<AlertsResponse>;
  filters: QueueFilters;
  onFilters: (filters: QueueFilters) => void;
  selectedKey: string | null;
  onSelect: (alert: Alert) => void;
};

const selectClass =
  "min-w-0 flex-1 rounded-btn border border-line bg-white px-2 py-1.5 text-[0.8125rem] text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-accent";

function Filters({
  all,
  filters,
  onFilters,
}: {
  all: readonly Alert[];
  filters: QueueFilters;
  onFilters: QueueProps["onFilters"];
}) {
  const recalls = distinct(all.map((alert) => alert.recall.recallNumber));
  const stores = distinct(all.map((alert) => `${String(alert.store.storeId)}|${alert.store.name}`));
  return (
    <div className="grid grid-cols-2 gap-2 border-b border-line px-4 py-3">
      <select
        aria-label="Filter by recall"
        className={selectClass}
        value={filters.recallNumber}
        onChange={(event) => {
          onFilters({ ...filters, recallNumber: event.target.value });
        }}
      >
        <option value="">All recalls</option>
        {recalls.map((recall) => (
          <option key={recall} value={recall}>
            {recall}
          </option>
        ))}
      </select>
      <select
        aria-label="Filter by store"
        className={selectClass}
        value={filters.storeId}
        onChange={(event) => {
          onFilters({ ...filters, storeId: event.target.value });
        }}
      >
        <option value="">All stores</option>
        {stores.map((store) => {
          const [id, name] = store.split("|");
          return (
            <option key={store} value={id}>
              {name}
            </option>
          );
        })}
      </select>
      <select
        aria-label="Filter by lot evidence"
        className={`${selectClass} col-span-2`}
        value={filters.level}
        onChange={(event) => {
          const level = lotEvidenceLevels.find((value) => value === event.target.value);
          onFilters({ ...filters, level: level ?? "" });
        }}
      >
        <option value="">All evidence</option>
        {lotEvidenceLevels.map((level: LotEvidenceLevel) => (
          <option key={level} value={level}>
            {lotBadges[level].label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Queue({ alerts, filters, onFilters, selectedKey, onSelect }: QueueProps) {
  const response = alerts.state === "ready" ? alerts.data : null;
  const all =
    response?.status === "RESULTS" || response?.status === "DEGRADED_CACHED" ? response.alerts : [];
  const visible = applyFilters(all, filters);
  const count = response !== null && "totalCases" in response ? response.totalCases : null;
  return (
    <Panel
      title="Investigation queue"
      aside={
        count === null ? null : (
          <span className="font-mono text-[0.75rem] text-mute tabular">{count} cases</span>
        )
      }
    >
      {alerts.state === "loading" ? (
        <p className="p-4 text-[0.875rem] text-mute">Running the four-source query in Zetaris…</p>
      ) : null}
      {alerts.state === "error" ? (
        <p
          className="m-4 rounded-btn bg-critical-soft p-3 text-[0.875rem] text-critical"
          role="alert"
        >
          The alerts request failed: {alerts.message}. Nothing below is current.
        </p>
      ) : null}
      {response ? <QueryBanner response={response} /> : null}
      {all.length > 0 ? <Filters all={all} filters={filters} onFilters={onFilters} /> : null}
      {all.length > 0 && visible.length === 0 ? (
        <p className="p-4 text-[0.875rem] text-mute">No cases match these filters.</p>
      ) : null}
      <ul className="divide-y divide-line">
        {visible.map((alert) => (
          <QueueItem
            key={alert.caseKey}
            alert={alert}
            selected={alert.caseKey === selectedKey}
            onSelect={() => {
              onSelect(alert);
            }}
          />
        ))}
      </ul>
    </Panel>
  );
}
