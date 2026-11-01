import { receivingStats } from "@clarilot/api/files";
import { openFdaMetaResponseSchema } from "@clarilot/core";
import {
  check,
  describe,
  firstNumber,
  runNamed,
  zetarisMissing,
  type Check,
  type Context,
} from "./context";

const recallSearch = "_exists_:openfda.product_ndc AND report_date:[20260701 TO 20261231]";

async function openFdaMeta(ctx: Context, path: string) {
  const response = await fetch(`${ctx.env.OPENFDA_BASE_URL}${path}`, {
    headers: { "user-agent": ctx.env.OPENFDA_USER_AGENT },
    signal: AbortSignal.timeout(15_000),
  });
  const parsed = openFdaMetaResponseSchema.safeParse(await response.json());
  return parsed.success ? parsed.data.meta : null;
}

export async function v01(ctx: Context): Promise<Check> {
  const base = {
    id: "V-01",
    title: "Zetaris version + SELECT 1",
    source: "zetaris",
    expected: "SELECT 1 returns 1 and SHOW SERVER VERSION answers",
  };
  const missing = zetarisMissing(ctx);
  if (missing !== null) {
    return check({ ...base, status: "FAIL", observed: missing });
  }
  const one = await runNamed(ctx, "select_one");
  const version = await runNamed(ctx, "server_version");
  const ok = firstNumber(one.outcome, "one") === 1 && version.outcome.ok;
  const observed = `select_one ${describe(one.outcome)}; server_version ${version.outcome.ok ? JSON.stringify(version.outcome.rows[0] ?? {}) : describe(version.outcome)}`;
  return check({ ...base, status: ok ? "PASS" : "FAIL", observed, queryId: one.queryId });
}

export async function v02(ctx: Context): Promise<Check> {
  const base = {
    id: "V-02",
    title: "PostgreSQL source count = direct psql",
    source: "pharmacy_pg.dispensing",
  };
  const rows = await ctx.db<{ n: number }[]>`select count(*)::int as n from dispensing`;
  const direct = rows[0]?.n ?? -1;
  const expected = `Zetaris count equals the direct Postgres count (${String(direct)})`;
  const missing = zetarisMissing(ctx);
  if (missing !== null) {
    return check({
      ...base,
      expected,
      status: "FAIL",
      observed: `direct count ${String(direct)}; ${missing}`,
    });
  }
  const ran = await runNamed(ctx, "count_dispensing");
  const via = firstNumber(ran.outcome, "row_count");
  return check({
    ...base,
    expected,
    status: via === direct ? "PASS" : "FAIL",
    observed: `direct ${String(direct)}, Zetaris ${via === null ? describe(ran.outcome) : String(via)}`,
    queryId: ran.queryId,
  });
}

export async function v03(ctx: Context): Promise<Check> {
  const meta = await openFdaMeta(
    ctx,
    `/drug/enforcement.json?search=${encodeURIComponent(recallSearch)}&limit=1`,
  );
  const total = meta?.results?.total ?? null;
  const base = {
    id: "V-03",
    title: "FDA recall table shape + count + timestamp",
    source: "FDA_RAW.recalls",
    expected: `page rows = min(total, 1000) with total ${String(total)} and last_updated ${meta?.last_updated ?? "unknown"} matching a direct openFDA call`,
  };
  const missing = zetarisMissing(ctx);
  if (missing !== null || total === null) {
    return check({
      ...base,
      status: "FAIL",
      observed: `direct openFDA total ${String(total)}, last_updated ${meta?.last_updated ?? "unavailable"}; ${missing ?? "direct openFDA call failed"}`,
    });
  }
  const ran = await runNamed(ctx, "count_recalls");
  const pageRows = firstNumber(ran.outcome, "page_rows");
  const zTotal = firstNumber(ran.outcome, "total_matching");
  const rawUpdated = ran.outcome.ok ? ran.outcome.rows[0]?.last_updated : undefined;
  const updated = typeof rawUpdated === "string" ? rawUpdated : "";
  const ok =
    pageRows === Math.min(total, 1000) && zTotal === total && updated === meta?.last_updated;
  return check({
    ...base,
    status: ok ? "PASS" : "FAIL",
    observed: ran.outcome.ok
      ? `page rows ${String(pageRows)}, total ${String(zTotal)}, last_updated ${updated}`
      : describe(ran.outcome),
    queryId: ran.queryId,
  });
}

export async function v04(ctx: Context): Promise<Check> {
  const meta = await openFdaMeta(ctx, "/drug/shortages.json?limit=1");
  const total = meta?.results?.total ?? null;
  const base = {
    id: "V-04",
    title: "FDA shortage table shape + bounded count",
    source: "FDA_RAW.shortages_p00",
    expected: `first page holds 100 rows of total ${String(total)} with last_updated ${meta?.last_updated ?? "unknown"}`,
  };
  const missing = zetarisMissing(ctx);
  if (missing !== null || total === null) {
    return check({
      ...base,
      status: "FAIL",
      observed: `direct openFDA total ${String(total)}, last_updated ${meta?.last_updated ?? "unavailable"}; ${missing ?? "direct openFDA call failed"}`,
    });
  }
  const ran = await runNamed(ctx, "count_shortages");
  const pageRows = firstNumber(ran.outcome, "page_rows");
  const zTotal = firstNumber(ran.outcome, "total_records");
  return check({
    ...base,
    status: pageRows === 100 && zTotal === total ? "PASS" : "FAIL",
    observed: ran.outcome.ok
      ? `page rows ${String(pageRows)}, total ${String(zTotal)}`
      : describe(ran.outcome),
    queryId: ran.queryId,
  });
}

export async function v05(ctx: Context): Promise<Check> {
  const stats = await receivingStats(ctx.env.RECEIVING_CSV_PATH);
  const base = {
    id: "V-05",
    title: "Receiving CSV row count = file line count",
    source: "lots_files.receiving_lots",
    expected: `Zetaris row count equals ${String(stats.rowCount)} data lines (sha256 ${stats.sha256.slice(0, 12)})`,
  };
  const missing = zetarisMissing(ctx);
  if (missing !== null) {
    return check({
      ...base,
      status: "FAIL",
      observed: `file has ${String(stats.rowCount)} data lines; ${missing}`,
    });
  }
  const ran = await runNamed(ctx, "count_receiving");
  const via = firstNumber(ran.outcome, "row_count");
  return check({
    ...base,
    status: via === stats.rowCount ? "PASS" : "FAIL",
    observed: `file ${String(stats.rowCount)}, Zetaris ${via === null ? describe(ran.outcome) : String(via)}`,
    queryId: ran.queryId,
  });
}
