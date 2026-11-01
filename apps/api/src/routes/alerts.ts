import {
  alertsQuerySchema,
  createDraftBodySchema,
  draftDecisionBodySchema,
  lotClassifierVersion,
  type AlertDetailResponse,
  type AlertsResponse,
  type QueryFailure,
} from "@clarilot/core";
import { Hono } from "hono";
import { filterAlerts } from "../alerts/candidates";
import { runAlertsQuery } from "../alerts/service";
import type { AppDeps } from "../deps";
import { createDraft, decideDraft, publicDraft } from "../drafts/service";
import { coverage } from "../health/scope";
import { notFound } from "../http/errors";
import { dispenseIdSchema, jsonBody, parseWith, uuidParamSchema } from "../http/parse";

const failureStatus = (failure: QueryFailure) => (failure.status === "TIMEOUT" ? 504 : 503);

export function alertRoutes(deps: AppDeps) {
  return new Hono()
    .get("/alerts", async (c) => {
      const query = parseWith(alertsQuerySchema, c.req.query());
      const run = await runAlertsQuery(deps);
      if (!run.ok) {
        return c.json<AlertsResponse>(run.failure, failureStatus(run.failure));
      }
      const filtered = filterAlerts(run.alerts, query);
      const start = (query.page - 1) * query.pageSize;
      return c.json<AlertsResponse>({
        status: run.status === "RESULTS" && filtered.length === 0 ? "EMPTY_VERIFIED" : run.status,
        queryId: run.queryId,
        queryName: run.queryName,
        fetchedAt: run.fetchedAt,
        latencyMs: run.latencyMs,
        coverage,
        cacheMode: run.cacheMode,
        snapshotTakenAt: null,
        sources: run.sources,
        classifierVersion: lotClassifierVersion,
        warnings: run.warnings,
        page: query.page,
        pageSize: query.pageSize,
        totalCases: filtered.length,
        alerts: filtered.slice(start, start + query.pageSize),
      });
    })
    .get("/alerts/:dispenseId", async (c) => {
      const dispenseId = parseWith(dispenseIdSchema, c.req.param("dispenseId"));
      const run = await runAlertsQuery(deps);
      if (!run.ok) {
        return c.json<AlertDetailResponse>(run.failure, failureStatus(run.failure));
      }
      const cases = run.alerts.filter((a) => a.dispense.dispenseId === dispenseId);
      const drafts = await deps.drafts.listForDispense(dispenseId);
      return c.json<AlertDetailResponse>({
        status: cases.length > 0 ? "RESULTS" : "EMPTY_VERIFIED",
        queryId: run.queryId,
        queryName: run.queryName,
        fetchedAt: run.fetchedAt,
        cacheMode: run.cacheMode,
        dispenseId,
        cases,
        drafts: drafts.map(publicDraft),
        warnings: run.warnings,
      });
    })
    .post("/alerts/:dispenseId/draft", async (c) => {
      const dispenseId = parseWith(dispenseIdSchema, c.req.param("dispenseId"));
      const body = parseWith(createDraftBodySchema, await jsonBody(c));
      return c.json(await createDraft(deps, dispenseId, body.recallNumber), 201);
    })
    .post("/drafts/:draftId/decision", async (c) => {
      const draftId = parseWith(uuidParamSchema, c.req.param("draftId"));
      const body = parseWith(draftDecisionBodySchema, await jsonBody(c));
      return c.json(await decideDraft(deps, draftId, body));
    })
    .get("/ledger/:queryId", async (c) => {
      const queryId = parseWith(uuidParamSchema, c.req.param("queryId"));
      const entry = await deps.ledger.get(queryId);
      if (entry === null) {
        throw notFound(`No ledger entry for query ${queryId}`, "QUERY_NOT_FOUND");
      }
      return c.json(entry);
    });
}
