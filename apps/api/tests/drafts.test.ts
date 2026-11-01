import { randomUUID } from "node:crypto";
import { alertsResponseSchema, draftSchema, isQueryFailure, type Alert } from "@clarilot/core";
import { describe, expect, it } from "vitest";
import { groundDraft } from "../src/drafts/grounding";
import { templateDraft } from "../src/drafts/template";
import { call, stubZetaris, testDeps } from "./support/fakes";
import { alertRow } from "./support/rows";

const queryId = "6a2d0ab6-c054-40c6-b23e-3bf5d28a52a5";

async function fixtureAlert(): Promise<Alert> {
  const zetaris = stubZetaris(() =>
    Promise.resolve({ ok: true, rows: [alertRow()], latencyMs: 5 }),
  );
  const { app } = await testDeps({ zetaris });
  const body = alertsResponseSchema.parse((await call(app, "GET", "/api/alerts")).body);
  const alert = isQueryFailure(body) ? undefined : body.alerts[0];
  if (alert === undefined) {
    throw new Error("fixture alert missing");
  }
  return alert;
}

describe("U-09 draft grounding", () => {
  it("passes the deterministic template for a real case", async () => {
    const alert = await fixtureAlert();
    const grounding = groundDraft(templateDraft(alert, queryId), alert, queryId);
    expect(grounding.checks.filter((c) => !c.ok)).toEqual([]);
    expect(grounding.ok).toBe(true);
  });

  it.each([
    ["an invented lot", { lotLabel: "LOT_EXACT: 9999999" }, "lot_label_matches_classifier"],
    ["a wrong recall number", { recallNumber: "D-0001-2027" }, "recall_number_matches_source"],
    [
      "an invented date",
      {
        draftText:
          "Hello. Your refill on 10/30/2026 is part of recall D-0038-2027. Please contact your pharmacist or prescriber.",
      },
      "no_unapproved_numbers",
    ],
    [
      "dosage advice",
      {
        draftText:
          "Hello. Recall D-0038-2027 applies. Stop taking this and double your dose. Please contact your pharmacist or prescriber.",
      },
      "no_medical_instruction_or_outcome_claim",
    ],
    [
      "a safety claim",
      {
        draftText:
          "Good news: you are safe from recall D-0038-2027. Please contact your pharmacist or prescriber.",
      },
      "no_medical_instruction_or_outcome_claim",
    ],
    ["an unknown source id", { sourceIds: ["D-0038-2027", "made-up-source"] }, "source_ids_known"],
  ])("rejects a draft with %s", async (_label, patch, failing) => {
    const alert = await fixtureAlert();
    const grounding = groundDraft({ ...templateDraft(alert, queryId), ...patch }, alert, queryId);
    expect(grounding.ok).toBe(false);
    expect(grounding.checks.find((c) => c.check === failing)?.ok).toBe(false);
  });
});

describe("POST /api/alerts/:dispenseId/draft and U-10 decisions", () => {
  async function drafted() {
    const zetaris = stubZetaris(() =>
      Promise.resolve({ ok: true, rows: [alertRow()], latencyMs: 5 }),
    );
    const context = await testDeps({ zetaris });
    const reply = await call(context.app, "POST", "/api/alerts/1390/draft", {
      recallNumber: "D-0038-2027",
    });
    expect(reply.status).toBe(201);
    return { ...context, draft: draftSchema.parse(reply.body) };
  }

  it("saves a pending, template-labelled, grounded draft that was never sent", async () => {
    const { draft } = await drafted();
    expect(draft).toMatchObject({
      state: "DRAFT_PENDING_REVIEW",
      generator: "template",
      modelName: null,
      sent: false,
    });
    expect(draft.grounding.ok).toBe(true);
  });

  it("repeats an approval idempotently and refuses a contradicting rejection", async () => {
    const { app, draft } = await drafted();
    const approve = {
      decision: "approve",
      reviewerLabel: "RPh test",
      idempotencyKey: randomUUID(),
    };
    const first = await call(app, "POST", `/api/drafts/${draft.draftId}/decision`, approve);
    const again = await call(app, "POST", `/api/drafts/${draft.draftId}/decision`, approve);
    expect(first.status).toBe(200);
    expect(again).toEqual(first);
    expect(draftSchema.parse(first.body).state).toBe("APPROVED_DRAFT");
    const reject = { decision: "reject", reviewerLabel: "RPh other", idempotencyKey: randomUUID() };
    const conflict = await call(app, "POST", `/api/drafts/${draft.draftId}/decision`, reject);
    expect(conflict).toMatchObject({ status: 409, body: { code: "DECISION_CONFLICT" } });
    const reused = await call(app, "POST", `/api/drafts/${draft.draftId}/decision`, {
      ...reject,
      idempotencyKey: approve.idempotencyKey,
    });
    expect(reused).toMatchObject({ status: 409, body: { code: "IDEMPOTENCY_KEY_REUSED" } });
  });

  it("refuses to approve a draft that failed grounding", async () => {
    const { app, draft, drafts } = await drafted();
    const stored = drafts.rows.find((r) => r.draftId === draft.draftId);
    if (stored === undefined) {
      throw new Error("stored draft missing");
    }
    stored.grounding = {
      ok: false,
      checks: [{ check: "no_unapproved_numbers", ok: false, detail: "test" }],
    };
    const reply = await call(app, "POST", `/api/drafts/${draft.draftId}/decision`, {
      decision: "approve",
      reviewerLabel: "RPh test",
      idempotencyKey: randomUUID(),
    });
    expect(reply).toMatchObject({ status: 422, body: { code: "GROUNDING_FAILED" } });
  });

  it("cannot draft without Zetaris and says so", async () => {
    const { app } = await testDeps();
    const reply = await call(app, "POST", "/api/alerts/1390/draft", {
      recallNumber: "D-0038-2027",
    });
    expect(reply).toMatchObject({ status: 503, body: { code: "SOURCE_UNAVAILABLE" } });
  });
});
