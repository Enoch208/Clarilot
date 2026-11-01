import { randomUUID } from "node:crypto";
import { draftSchema, type Draft, type DraftContent, type DraftDecisionBody } from "@clarilot/core";
import { runAlertsQuery } from "../alerts/service";
import type { AppDeps } from "../deps";
import { HttpError, notFound } from "../http/errors";
import type { DraftRecord } from "../stores/drafts";
import { planDecision } from "./decision";
import { groundDraft } from "./grounding";
import { templateDraft } from "./template";

export const publicDraft = (record: DraftRecord): Draft => draftSchema.parse(record);

const sameFacts = (a: DraftContent, b: DraftContent) =>
  a.recallNumber === b.recallNumber &&
  a.drugLabel === b.drugLabel &&
  a.lotLabel === b.lotLabel &&
  a.pharmacistNote === b.pharmacistNote;

export async function createDraft(
  deps: AppDeps,
  dispenseId: number,
  recallNumber: string,
): Promise<Draft> {
  const run = await runAlertsQuery(deps);
  if (!run.ok) {
    throw new HttpError(503, run.failure.status, run.failure.reason);
  }
  const alert = run.alerts.find((a) => a.caseKey === `${recallNumber}:${String(dispenseId)}`);
  if (alert === undefined) {
    throw notFound(
      `Query ${run.queryId} returned no case for recall ${recallNumber} and dispense ${String(dispenseId)}`,
      "CASE_NOT_FOUND",
    );
  }
  const content = templateDraft(alert, run.queryId);
  const existing = await deps.drafts.findActive(dispenseId, recallNumber);
  if (existing !== null) {
    if (sameFacts(existing.content, content)) {
      return publicDraft(existing);
    }
    await deps.drafts.invalidate(existing.draftId);
  }
  const record = await deps.drafts.insert({
    draftId: randomUUID(),
    caseKey: alert.caseKey,
    dispenseId,
    recallNumber,
    state: "DRAFT_PENDING_REVIEW",
    generator: "template",
    modelName: null,
    content,
    grounding: groundDraft(content, alert, run.queryId),
    sourceQueryId: run.queryId,
    reviewerLabel: null,
    decidedAt: null,
    createdAt: deps.now().toISOString(),
    sent: false,
  });
  return publicDraft(record);
}

export async function decideDraft(
  deps: Pick<AppDeps, "drafts">,
  draftId: string,
  request: DraftDecisionBody,
): Promise<Draft> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const current = await deps.drafts.get(draftId);
    if (current === null) {
      throw notFound(`No draft ${draftId}`, "DRAFT_NOT_FOUND");
    }
    const plan = planDecision(current, request);
    if (plan.kind === "conflict") {
      throw new HttpError(plan.status, plan.code, plan.message);
    }
    if (plan.kind === "replay") {
      return publicDraft(current);
    }
    const applied = await deps.drafts.applyDecision(draftId, {
      state: plan.state,
      decision: request.decision,
      reviewerLabel: request.reviewerLabel,
      idempotencyKey: request.idempotencyKey,
    });
    if (applied !== null) {
      return publicDraft(applied);
    }
  }
  throw new HttpError(409, "DECISION_RACE", "The draft changed while this decision was recorded");
}
