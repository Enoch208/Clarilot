import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  alertsResponseSchema,
  healthResponseSchema,
  type Alert,
  type AlertsResponse,
} from "@clarilot/core";
import { CaseView } from "@/components/console/CaseView";
import { ConsoleHeader } from "@/components/console/ConsoleHeader";
import { DemoControls } from "@/components/console/DemoControls";
import { LedgerView } from "@/components/console/LedgerView";
import { ProofDrawer } from "@/components/console/ProofDrawer";
import { QualityView } from "@/components/console/QualityView";
import { Queue } from "@/components/console/Queue";
import { applyFilters, emptyFilters, type QueueFilters } from "@/components/console/queue-filters";
import { SourceStrip } from "@/components/console/SourceStrip";
import { SourcesView } from "@/components/console/SourcesView";
import { parseView } from "@/components/console/views";
import { Workbench } from "@/components/console/Workbench";
import { formatAge } from "@/lib/format";
import { isQueryFailure } from "@/lib/query-state";
import { useCaseDrafts } from "@/lib/use-case-drafts";
import { useNow } from "@/lib/use-now";
import { useResource } from "@/lib/use-resource";

function proofSummary(response: AlertsResponse, now: number): string {
  if (isQueryFailure(response)) {
    return `${response.queryName} · ${response.status} · ${formatAge(response.checkedAt, now)}`;
  }
  return `${response.queryName} · ${String(response.latencyMs)} ms · ${String(response.totalCases)} cases · ${String(response.sources.length)} sources · ran ${formatAge(response.fetchedAt, now)}`;
}

export function ConsolePage() {
  const [params, setParams] = useSearchParams();
  const view = parseView(params.get("view"));
  const now = useNow(15_000);
  const { resource: alerts, reload: rerun } = useResource(
    "/api/alerts?pageSize=200",
    alertsResponseSchema,
  );
  const { resource: health, reload: recheck } = useResource("/api/health", healthResponseSchema);
  const [filters, setFilters] = useState<QueueFilters>(emptyFilters);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const response = alerts.state === "ready" ? alerts.data : null;
  const cases =
    response !== null && "alerts" in response ? applyFilters(response.alerts, filters) : [];
  const selected: Alert | null =
    cases.find((alert) => alert.caseKey === selectedKey) ?? cases[0] ?? null;
  const drafts = useCaseDrafts(selected);

  const run = () => {
    rerun();
    recheck();
  };

  return (
    <div className="flex min-h-dvh flex-col gap-3 bg-mist p-3 text-ink lg:h-dvh lg:p-4">
      <ConsoleHeader
        view={view}
        onView={(next) => {
          setParams(next === "investigations" ? {} : { view: next });
        }}
        onRun={run}
        running={alerts.state === "loading"}
      />
      <SourceStrip health={health} now={now} />
      {view === "investigations" ? (
        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[22rem_minmax(0,1fr)_21rem]">
          <Queue
            alerts={alerts}
            filters={filters}
            onFilters={setFilters}
            selectedKey={selected?.caseKey ?? null}
            onSelect={(alert) => {
              setSelectedKey(alert.caseKey);
            }}
          />
          <CaseView
            alert={selected}
            onPrepareDraft={drafts.create}
            drafting={drafts.busy === "draft"}
          />
          <Workbench alert={selected} drafts={drafts} />
        </div>
      ) : null}
      {view === "quality" ? <QualityView /> : null}
      {view === "sources" ? <SourcesView now={now} /> : null}
      {view === "ledger" ? <LedgerView currentQueryId={response?.queryId ?? null} /> : null}
      {view === "investigations" ? (
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <ProofDrawer
              queryId={response?.queryId ?? null}
              summary={response === null ? "" : proofSummary(response, now)}
            />
          </div>
          <DemoControls onChanged={recheck} />
        </div>
      ) : null}
    </div>
  );
}
