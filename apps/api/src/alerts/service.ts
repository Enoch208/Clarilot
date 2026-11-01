import { randomUUID } from "node:crypto";
import {
  lotClassifierVersion,
  type Alert,
  type CacheMode,
  type QueryFailure,
  type QuerySuccessState,
  type SourceStamp,
} from "@clarilot/core";
import type { AppDeps } from "../deps";
import { recordOutcome } from "../ledger";
import { mapAlertRows } from "./candidates";

export type AlertsRun =
  | { ok: false; failure: QueryFailure }
  | {
      ok: true;
      status: QuerySuccessState;
      queryId: string;
      queryName: string;
      fetchedAt: string;
      latencyMs: number;
      cacheMode: CacheMode;
      sources: SourceStamp[];
      alerts: Alert[];
      warnings: string[];
    };

const classRank = (classification: string) =>
  ({ "Class I": 0, "Class II": 1, "Class III": 2 })[classification] ?? 3;

export function byPriority(a: Alert, b: Alert): number {
  return (
    classRank(a.recall.classification) - classRank(b.recall.classification) ||
    b.recall.reportDate.raw.localeCompare(a.recall.reportDate.raw) ||
    b.dispense.dispensedAt.localeCompare(a.dispense.dispensedAt) ||
    a.caseKey.localeCompare(b.caseKey)
  );
}

export async function runAlertsQuery(deps: AppDeps): Promise<AlertsRun> {
  const query = deps.registry.get("alerts_master");
  const queryId = randomUUID();
  const outcome = await deps.zetaris.run(query, queryId);
  const fetchedAt = deps.now().toISOString();
  if (!outcome.ok) {
    await recordOutcome(deps, query, queryId, outcome, null);
    return {
      ok: false,
      failure: {
        status: outcome.state,
        queryId,
        queryName: query.name,
        checkedAt: fetchedAt,
        failedSource: outcome.errorCode.startsWith("ZETARIS") ? "zetaris" : null,
        reason: outcome.reason,
      },
    };
  }
  const mapped = mapAlertRows(outcome.rows);
  const status: QuerySuccessState = mapped.alerts.length > 0 ? "RESULTS" : "EMPTY_VERIFIED";
  const cacheMode: CacheMode = "CACHED_FDA_UNCACHED_PHARMACY";
  const stamps: Record<string, string | null> = {
    fda_recalls: mapped.recallsLastUpdated,
    fda_shortages: mapped.shortagesLastUpdated,
    pharmacy_pg: fetchedAt,
    receiving_csv: null,
  };
  await recordOutcome(deps, query, queryId, outcome, {
    status,
    rowCount: outcome.rows.length,
    fetchedAt: stamps,
    cacheMode,
    classifierVersion: lotClassifierVersion,
  });
  const warnings = [
    ...(deps.registry.verifiedInZetaris
      ? []
      : [
          "The named SQL has not yet been verified against the SQL Editor; treat results as unverified",
        ]),
    ...(mapped.rejectedRows > 0
      ? [
          `${String(mapped.rejectedRows)} returned rows did not match the expected shape and are not shown`,
        ]
      : []),
    "Lot evidence is classified by the API's deterministic classifier from the code_info that Zetaris returned",
  ];
  return {
    ok: true,
    status,
    queryId,
    queryName: query.name,
    fetchedAt,
    latencyMs: outcome.latencyMs,
    cacheMode,
    sources: [
      {
        source: "pharmacy_pg",
        zetarisObject: "pharmacy_pg.dispensing",
        sourcePublishedAt: null,
        fetchedAt,
      },
      {
        source: "fda_recalls",
        zetarisObject: "fda.recalls_by_ndc",
        sourcePublishedAt: mapped.recallsLastUpdated,
        fetchedAt: null,
      },
      {
        source: "fda_shortages",
        zetarisObject: "fda.shortages_by_ndc",
        sourcePublishedAt: mapped.shortagesLastUpdated,
        fetchedAt: null,
      },
      {
        source: "receiving_csv",
        zetarisObject: "lots_files.receiving_lots",
        sourcePublishedAt: null,
        fetchedAt: null,
      },
    ],
    alerts: [...mapped.alerts].sort(byPriority),
    warnings,
  };
}
