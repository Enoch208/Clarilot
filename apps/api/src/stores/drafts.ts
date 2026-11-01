import {
  draftContentSchema,
  draftSchema,
  groundingSchema,
  reviewDecisionSchema,
  type Draft,
  type DraftState,
  type ReviewDecision,
} from "@clarilot/core";
import type { Db } from "../db";

export type DraftRecord = Draft & {
  decision: ReviewDecision | null;
  idempotencyKey: string | null;
};

export type DecisionWrite = {
  state: DraftState;
  decision: ReviewDecision;
  reviewerLabel: string;
  idempotencyKey: string;
};

export type DraftStore = {
  get(draftId: string): Promise<DraftRecord | null>;
  findActive(dispenseId: number, recallNumber: string): Promise<DraftRecord | null>;
  listForDispense(dispenseId: number): Promise<DraftRecord[]>;
  insert(draft: Draft): Promise<DraftRecord>;
  invalidate(draftId: string): Promise<void>;
  applyDecision(draftId: string, write: DecisionWrite): Promise<DraftRecord | null>;
};

type DraftRow = {
  action_id: string;
  dispense_id: number;
  recall_number: string;
  case_key: string;
  draft_json: unknown;
  grounding_json: unknown;
  generator: string;
  status: string;
  source_query_id: string;
  reviewer_label: string | null;
  decision: string | null;
  idempotency_key: string | null;
  decided_at: Date | null;
  model_name: string | null;
  created_at: Date;
};

function toRecord(row: DraftRow): DraftRecord {
  const draft = draftSchema.parse({
    draftId: row.action_id,
    caseKey: row.case_key,
    dispenseId: row.dispense_id,
    recallNumber: row.recall_number,
    state: row.status,
    generator: row.generator,
    modelName: row.model_name,
    content: draftContentSchema.parse(row.draft_json),
    grounding: groundingSchema.parse(row.grounding_json),
    sourceQueryId: row.source_query_id,
    reviewerLabel: row.reviewer_label,
    decidedAt: row.decided_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    sent: false,
  });
  return {
    ...draft,
    decision: row.decision === null ? null : reviewDecisionSchema.parse(row.decision),
    idempotencyKey: row.idempotency_key,
  };
}

export function postgresDrafts(db: Db): DraftStore {
  const one = (rows: DraftRow[]) => (rows[0] === undefined ? null : toRecord(rows[0]));
  return {
    async get(draftId) {
      return one(
        await db<DraftRow[]>`select * from app.outreach_actions where action_id = ${draftId}`,
      );
    },
    async findActive(dispenseId, recallNumber) {
      return one(
        await db<DraftRow[]>`
        select * from app.outreach_actions
        where dispense_id = ${dispenseId} and recall_number = ${recallNumber}
          and status <> 'INVALIDATED_DRAFT'`,
      );
    },
    async listForDispense(dispenseId) {
      const rows = await db<DraftRow[]>`
        select * from app.outreach_actions where dispense_id = ${dispenseId} order by created_at`;
      return rows.map(toRecord);
    },
    async insert(draft) {
      const rows = await db<DraftRow[]>`
        insert into app.outreach_actions (
          action_id, dispense_id, recall_number, case_key, draft_json, grounding_json,
          grounding_ok, generator, status, source_query_id, model_name
        ) values (
          ${draft.draftId}, ${draft.dispenseId}, ${draft.recallNumber}, ${draft.caseKey},
          ${db.json(draft.content)}, ${db.json(draft.grounding)}, ${draft.grounding.ok},
          ${draft.generator}, ${draft.state}, ${draft.sourceQueryId}, ${draft.modelName}
        ) returning *`;
      const record = one(rows);
      if (record === null) {
        throw new Error("The draft insert returned no row");
      }
      return record;
    },
    async invalidate(draftId) {
      await db`update app.outreach_actions set status = 'INVALIDATED_DRAFT' where action_id = ${draftId}`;
    },
    async applyDecision(draftId, write) {
      return one(
        await db<DraftRow[]>`
        update app.outreach_actions
        set status = ${write.state}, decision = ${write.decision},
            reviewer_label = ${write.reviewerLabel}, idempotency_key = ${write.idempotencyKey},
            decided_at = now()
        where action_id = ${draftId} and status = 'DRAFT_PENDING_REVIEW'
        returning *`,
      );
    },
  };
}
