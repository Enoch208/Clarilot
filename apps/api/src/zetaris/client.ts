import { randomUUID } from "node:crypto";
import type { QueryFailureState } from "@clarilot/core";
import { z } from "zod";
import { sanitize } from "../http/errors";
import type { NamedQuery } from "../sql/registry";

export type ZetarisRow = Record<string, unknown>;

export type ZetarisOutcome =
  | { ok: true; rows: ZetarisRow[]; latencyMs: number }
  | {
      ok: false;
      state: QueryFailureState;
      errorCode: string;
      reason: string;
      latencyMs: number;
    };

export type ZetarisTransport = "UI_PROXY" | "REST_V1";

export type ZetarisClient = {
  configured: boolean;
  transport: ZetarisTransport | null;
  principal: string | null;
  run(query: NamedQuery, queryId: string): Promise<ZetarisOutcome>;
};

export const notConfiguredReason =
  "Zetaris is not configured on this API (ZETARIS_BASE_URL, ZETARIS_API_KEY and ZETARIS_ORG_ID are unset), so the federated query cannot run.";

export function unconfiguredZetaris(): ZetarisClient {
  return {
    configured: false,
    transport: null,
    principal: null,
    run: () =>
      Promise.resolve({
        ok: false,
        state: "SOURCE_UNAVAILABLE",
        errorCode: "ZETARIS_NOT_CONFIGURED",
        reason: notConfiguredReason,
        latencyMs: 0,
      }),
  };
}

const headerSchema = z.union([z.string(), z.object({ name: z.string() }).loose()]);

export const sqlResponseSchema = z
  .object({
    data: z.array(z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())])),
    headers: z.array(headerSchema).optional(),
  })
  .loose();

export function rowsFrom(body: z.infer<typeof sqlResponseSchema>): ZetarisRow[] | null {
  const names = (body.headers ?? []).map((h) => (typeof h === "string" ? h : h.name));
  const rows: ZetarisRow[] = [];
  for (const row of body.data) {
    if (!Array.isArray(row)) {
      rows.push(row);
      continue;
    }
    if (names.length !== row.length) {
      return null;
    }
    rows.push(Object.fromEntries(names.map((name, index) => [name, row[index]])));
  }
  return rows;
}

export type ZetarisOptions = {
  baseUrl: string;
  apiKey: string;
  orgId: string;
  transport: ZetarisTransport;
  principal: string | null;
  timeoutMs: number;
  rowLimit: number;
  fetch: typeof fetch;
};

function failure(state: QueryFailureState, errorCode: string, reason: string, started: number) {
  return { ok: false as const, state, errorCode, reason, latencyMs: Date.now() - started };
}

export function httpZetaris(options: ZetarisOptions): ZetarisClient {
  const route =
    options.transport === "UI_PROXY"
      ? "/api/proxy/sql-editor/sqls/run-query"
      : "/sql-editor/sqls/run";
  return {
    configured: true,
    transport: options.transport,
    principal: options.principal,
    async run(query, queryId) {
      const started = Date.now();
      const body =
        options.transport === "UI_PROXY"
          ? { sql: query.sql, limit: options.rowLimit }
          : { queryId, sql: query.sql, source: "SqlEditor", limit: options.rowLimit };
      let response: Response;
      try {
        response = await options.fetch(`${options.baseUrl}${route}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${options.apiKey}`,
            "X-Org-ID": options.orgId,
            "X-Request-ID": randomUUID(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(options.timeoutMs),
        });
      } catch (error) {
        const timedOut = error instanceof DOMException && error.name === "TimeoutError";
        return timedOut
          ? failure(
              "TIMEOUT",
              "ZETARIS_TIMEOUT",
              `Zetaris did not answer within ${String(options.timeoutMs)} ms`,
              started,
            )
          : failure(
              "SOURCE_UNAVAILABLE",
              "ZETARIS_UNREACHABLE",
              `Zetaris could not be reached: ${sanitize(error instanceof Error ? error.message : "network error")}`,
              started,
            );
      }
      if (response.status === 401 || response.status === 403) {
        return failure(
          "ACCESS_DENIED",
          `ZETARIS_HTTP_${String(response.status)}`,
          "Zetaris refused the API credentials for this query",
          started,
        );
      }
      if (!response.ok) {
        const text = sanitize(await response.text());
        return failure(
          "SOURCE_UNAVAILABLE",
          `ZETARIS_HTTP_${String(response.status)}`,
          `Zetaris returned HTTP ${String(response.status)}: ${text}`,
          started,
        );
      }
      const parsed = sqlResponseSchema.safeParse(await response.json());
      const rows = parsed.success ? rowsFrom(parsed.data) : null;
      if (rows === null) {
        return failure(
          "SOURCE_UNAVAILABLE",
          "ZETARIS_UNEXPECTED_RESPONSE",
          "Zetaris answered with a response shape this API does not recognise",
          started,
        );
      }
      return { ok: true, rows, latencyMs: Date.now() - started };
    },
  };
}
