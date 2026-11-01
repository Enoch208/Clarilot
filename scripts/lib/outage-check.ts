import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { repoRoot } from "@clarilot/api/files";
import { alertsResponseSchema, healthResponseSchema, isQueryFailure } from "@clarilot/core";
import { check, type Check, type Context } from "./context";

const run = promisify(execFile);

async function api(ctx: Context, path: string): Promise<unknown> {
  const response = await fetch(`${ctx.apiBase}${path}`, { signal: AbortSignal.timeout(90_000) });
  return response.json();
}

export async function v10(ctx: Context): Promise<Check> {
  const base = {
    id: "V-10",
    title: "Source outage does not appear as 0 cases",
    source: `${ctx.apiBase}/api/alerts`,
    expected:
      "with a source down, /api/alerts answers a failure state with no alert rows, never EMPTY_VERIFIED",
  };
  const health = await api(ctx, "/api/health").then(
    (body) => healthResponseSchema.safeParse(body),
    () => null,
  );
  if (health === null || !health.success) {
    return check({
      ...base,
      status: "FAIL",
      observed: "the API is not running or /api/health did not match the contract",
    });
  }
  const down = Object.entries(health.data)
    .filter(([, v]) => typeof v === "object" && "status" in v && v.status !== "OK")
    .map(([k]) => k);
  if (down.length === 0 && ctx.outage) {
    await run("docker", ["compose", "stop", "clarilot-pg"], { cwd: repoRoot });
  }
  const alerts = alertsResponseSchema.safeParse(await api(ctx, "/api/alerts"));
  if (down.length === 0 && ctx.outage) {
    await run("docker", ["compose", "start", "clarilot-pg"], { cwd: repoRoot });
  }
  if (!alerts.success) {
    return check({ ...base, status: "FAIL", observed: "/api/alerts did not match the contract" });
  }
  const outage =
    down.length > 0 ? down.join(", ") : ctx.outage ? "clarilot-pg stopped for this check" : null;
  if (outage === null) {
    return check({
      ...base,
      status: "FAIL",
      observed: "every source was up and --outage was not given, so no outage was exercised",
    });
  }
  const failed = isQueryFailure(alerts.data);
  return check({
    ...base,
    status: failed ? "PASS" : "FAIL",
    observed: `down: ${outage}; /api/alerts answered ${alerts.data.status}${failed ? " with no alert rows" : ""}`,
    queryId: alerts.data.queryId,
  });
}
