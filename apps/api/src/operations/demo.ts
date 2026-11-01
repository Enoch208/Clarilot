import { createHash, timingSafeEqual } from "node:crypto";
import type { DemoCasesResponse, DemoInsertResponse, DemoResetResponse } from "@clarilot/core";
import type { AppDeps } from "../deps";
import { forbidden, notFound } from "../http/errors";

const digest = (value: string) => createHash("sha256").update(value).digest();

export function requireDemo(deps: Pick<AppDeps, "demo">, token: string | undefined): void {
  if (!deps.demo.enabled || deps.demo.token === null) {
    throw notFound("Demo controls are disabled on this API", "DEMO_DISABLED");
  }
  if (token === undefined || !timingSafeEqual(digest(token), digest(deps.demo.token))) {
    throw forbidden("DEMO_TOKEN_INVALID", "The demo token is missing or wrong");
  }
}

export async function listDemoCases(deps: AppDeps): Promise<DemoCasesResponse> {
  if (!deps.demo.enabled) {
    return { demoMode: false, cases: [] };
  }
  const present = new Set(
    await deps.pharmacy.presentDispenseIds(deps.demoCases.map((c) => c.dispenseId)),
  );
  return {
    demoMode: true,
    cases: deps.demoCases.map((c) => ({
      demoCaseId: c.demoCaseId,
      label: c.label,
      dispenseId: c.dispenseId,
      recallNumber: c.recallNumber,
      inserted: present.has(c.dispenseId),
    })),
  };
}

export async function insertDemoCase(
  deps: AppDeps,
  demoCaseId: string,
): Promise<DemoInsertResponse> {
  const demo = deps.demoCases.find((c) => c.demoCaseId === demoCaseId);
  if (demo === undefined) {
    throw notFound(`${demoCaseId} is not an allowlisted demo case`, "UNKNOWN_DEMO_CASE");
  }
  const result = await deps.pharmacy.insertDemoDispense(demo);
  return {
    demoCaseId,
    dispenseId: demo.dispenseId,
    inserted: result.inserted,
    insertedAt: result.insertedAt,
    note: result.inserted
      ? "One synthetic dispense row was committed to the pharmacy Postgres source; rerun the alerts query to see whether it appears"
      : "The row was already present; nothing was inserted",
  };
}

export async function resetDemo(deps: AppDeps): Promise<DemoResetResponse> {
  const removed = await deps.pharmacy.removeDispenses(deps.demoCases.map((c) => c.dispenseId));
  return { ...removed, resetAt: deps.now().toISOString() };
}
