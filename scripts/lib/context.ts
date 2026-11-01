import { randomUUID } from "node:crypto";
import { createDb, type Db } from "@clarilot/api/db";
import { loadApiEnv, type ApiEnv } from "@clarilot/api/env";
import { fromRepo } from "@clarilot/api/files";
import { loadRegistry, type NamedQuery, type SqlRegistry } from "@clarilot/api/registry";
import type { ZetarisClient, ZetarisOutcome } from "@clarilot/api/zetaris";
import { zetarisFromEnv } from "@clarilot/api/zetaris-env";

export type CheckStatus = "PASS" | "FAIL";

export type Check = {
  id: string;
  title: string;
  status: CheckStatus;
  source: string;
  expected: string;
  observed: string;
  queryId: string | null;
  evidencePath: string | null;
  checkedAt: string;
};

export type Context = {
  env: ApiEnv;
  db: Db;
  zetaris: ZetarisClient;
  registry: SqlRegistry;
  apiBase: string;
  outage: boolean;
};

export async function createContext(argv: readonly string[]): Promise<Context> {
  const env = loadApiEnv(process.env);
  if (env.DATABASE_URL === undefined) {
    throw new Error(
      "verify compares Zetaris with a direct Postgres read, so DATABASE_URL must be set in .env",
    );
  }
  return {
    env,
    db: createDb(env.DATABASE_URL),
    zetaris: zetarisFromEnv(env),
    registry: await loadRegistry(fromRepo(env.SQL_NAMED_DIR)),
    apiBase: process.env.CLARILOT_API_BASE ?? `http://127.0.0.1:${String(env.API_PORT)}`,
    outage: argv.includes("--outage"),
  };
}

export type Ran = { queryId: string; outcome: ZetarisOutcome };

export async function runNamed(ctx: Context, name: string): Promise<Ran> {
  return runQuery(ctx, ctx.registry.get(name));
}

export async function runQuery(ctx: Context, query: NamedQuery): Promise<Ran> {
  const queryId = randomUUID();
  return { queryId, outcome: await ctx.zetaris.run(query, queryId) };
}

export function check(
  partial: Omit<Check, "checkedAt" | "queryId" | "evidencePath"> &
    Partial<Pick<Check, "queryId" | "evidencePath">>,
): Check {
  return {
    queryId: null,
    evidencePath: null,
    ...partial,
    checkedAt: new Date().toISOString(),
  };
}

export const zetarisMissing = (ctx: Context) =>
  ctx.zetaris.configured ? null : "Zetaris is not configured, so the Zetaris side was not run";

export function firstNumber(outcome: ZetarisOutcome, column: string): number | null {
  if (!outcome.ok) {
    return null;
  }
  const value = Number(outcome.rows[0]?.[column]);
  return Number.isFinite(value) ? value : null;
}

export function caseKeys(outcome: ZetarisOutcome): string[] {
  if (!outcome.ok) {
    return [];
  }
  const keys = outcome.rows.map((row) => {
    const recall = row.recall_number;
    const dispense = row.dispense_id;
    return typeof recall === "string" &&
      (typeof dispense === "string" || typeof dispense === "number")
      ? `${recall}:${String(dispense)}`
      : "";
  });
  return [...new Set(keys.filter((key) => key !== ""))].sort();
}

export const describe = (outcome: ZetarisOutcome) =>
  outcome.ok ? `${String(outcome.rows.length)} rows` : `${outcome.state}: ${outcome.reason}`;
