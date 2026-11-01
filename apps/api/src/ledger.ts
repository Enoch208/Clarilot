import type { CacheMode, QueryState } from "@clarilot/core";
import type { AppDeps } from "./deps";
import type { NamedQuery } from "./sql/registry";
import type { ZetarisOutcome } from "./zetaris/client";

export type SuccessDetail = {
  status: QueryState;
  rowCount: number;
  fetchedAt: Record<string, string | null> | null;
  cacheMode: CacheMode;
  classifierVersion: string | null;
};

export async function recordOutcome(
  deps: Pick<AppDeps, "ledger" | "zetaris">,
  query: NamedQuery,
  queryId: string,
  outcome: ZetarisOutcome,
  success: SuccessDetail | null,
): Promise<void> {
  const base = {
    queryId,
    queryName: query.name,
    statementSha256: query.sha256,
    safeSql: query.sql,
    zetarisPrincipal: deps.zetaris.principal,
    sourceNames: query.sourceNames,
    latencyMs: outcome.latencyMs,
  };
  if (!outcome.ok) {
    await deps.ledger.record({
      ...base,
      fetchedAt: null,
      cacheMode: null,
      rowCount: null,
      executionStatus: outcome.state,
      errorCode: outcome.errorCode,
      errorSummary: outcome.reason,
      classifierVersion: null,
    });
    return;
  }
  await deps.ledger.record({
    ...base,
    fetchedAt: success?.fetchedAt ?? null,
    cacheMode: success?.cacheMode ?? null,
    rowCount: success?.rowCount ?? outcome.rows.length,
    executionStatus: success?.status ?? (outcome.rows.length > 0 ? "RESULTS" : "EMPTY_VERIFIED"),
    errorCode: null,
    errorSummary: null,
    classifierVersion: success?.classifierVersion ?? null,
  });
}
