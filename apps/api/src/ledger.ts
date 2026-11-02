import type { CacheMode, QueryState } from "@clarilot/core";
import type { AppDeps } from "./deps";
import { sanitize } from "./http/errors";
import type { NamedQuery } from "./sql/registry";
import type { LedgerWrite } from "./stores/ledger";
import type { ZetarisOutcome } from "./zetaris/client";

export type SuccessDetail = {
  status: QueryState;
  rowCount: number;
  fetchedAt: Record<string, string | null> | null;
  cacheMode: CacheMode;
  classifierVersion: string | null;
};

export type LedgerNote = string | null;

export function withLedgerNote(text: string, note: LedgerNote): string {
  return note === null ? text : `${text}. ${note}`;
}

function write(deps: Pick<AppDeps, "ledger">, entry: LedgerWrite): Promise<LedgerNote> {
  return deps.ledger.record(entry).then(
    () => null,
    (error: unknown) =>
      `This run was not recorded in the query ledger: ${sanitize(error instanceof Error ? error.message : "the ledger write failed")}`,
  );
}

export function recordOutcome(
  deps: Pick<AppDeps, "ledger" | "zetaris">,
  query: NamedQuery,
  queryId: string,
  outcome: ZetarisOutcome,
  success: SuccessDetail | null,
): Promise<LedgerNote> {
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
    return write(deps, {
      ...base,
      fetchedAt: null,
      cacheMode: null,
      rowCount: null,
      executionStatus: outcome.state,
      errorCode: outcome.errorCode,
      errorSummary: outcome.reason,
      classifierVersion: null,
    });
  }
  return write(deps, {
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
