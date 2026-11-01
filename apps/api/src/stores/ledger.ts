import {
  ledgerEntrySchema,
  type CacheMode,
  type LedgerEntry,
  type QueryState,
} from "@clarilot/core";
import type { Db } from "../db";

export type LedgerWrite = {
  queryId: string;
  queryName: string;
  statementSha256: string;
  safeSql: string;
  zetarisPrincipal: string | null;
  sourceNames: string[];
  fetchedAt: Record<string, string | null> | null;
  cacheMode: CacheMode | null;
  rowCount: number | null;
  latencyMs: number | null;
  executionStatus: QueryState;
  errorCode: string | null;
  errorSummary: string | null;
  classifierVersion: string | null;
};

export type LedgerStore = {
  record(entry: LedgerWrite): Promise<void>;
  get(queryId: string): Promise<LedgerEntry | null>;
};

type LedgerRow = {
  query_id: string;
  query_name: string;
  statement_sha256: string;
  safe_sql: string;
  zetaris_principal: string | null;
  source_names: unknown;
  fetched_at: unknown;
  cache_mode: string | null;
  row_count: number | null;
  latency_ms: number | null;
  execution_status: string;
  error_code: string | null;
  error_summary: string | null;
  classifier_version: string | null;
  created_at: Date;
};

export function postgresLedger(db: Db): LedgerStore {
  return {
    async record(e) {
      await db`
        insert into app.query_ledger (
          query_id, query_name, statement_sha256, safe_sql, zetaris_principal, source_names,
          fetched_at, cache_mode, row_count, latency_ms, execution_status, error_code,
          error_summary, classifier_version
        ) values (
          ${e.queryId}, ${e.queryName}, ${e.statementSha256}, ${e.safeSql}, ${e.zetarisPrincipal},
          ${db.json(e.sourceNames)}, ${e.fetchedAt === null ? null : db.json(e.fetchedAt)},
          ${e.cacheMode}, ${e.rowCount}, ${e.latencyMs}, ${e.executionStatus}, ${e.errorCode},
          ${e.errorSummary}, ${e.classifierVersion}
        )`;
    },
    async get(queryId) {
      const rows = await db<
        LedgerRow[]
      >`select * from app.query_ledger where query_id = ${queryId}`;
      const row = rows[0];
      if (row === undefined) {
        return null;
      }
      return ledgerEntrySchema.parse({
        queryId: row.query_id,
        queryName: row.query_name,
        statementSha256: row.statement_sha256,
        safeSql: row.safe_sql,
        zetarisPrincipal: row.zetaris_principal,
        sourceNames: row.source_names,
        fetchedAt: row.fetched_at,
        cacheMode: row.cache_mode,
        rowCount: row.row_count,
        latencyMs: row.latency_ms,
        executionStatus: row.execution_status,
        errorCode: row.error_code,
        errorSummary: row.error_summary,
        classifierVersion: row.classifier_version,
        createdAt: row.created_at.toISOString(),
      });
    },
  };
}
