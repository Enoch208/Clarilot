import type { DraftDecisionBody, DraftState } from "@clarilot/core";
import type { DraftRecord } from "../stores/drafts";

export type DecisionPlan =
  | { kind: "apply"; state: DraftState }
  | { kind: "replay" }
  | { kind: "conflict"; status: 409 | 422; code: string; message: string };

const decided: Record<DraftDecisionBody["decision"], DraftState> = {
  approve: "APPROVED_DRAFT",
  reject: "REJECTED_DRAFT",
};

export function planDecision(
  current: Pick<DraftRecord, "state" | "decision" | "idempotencyKey" | "grounding">,
  request: DraftDecisionBody,
): DecisionPlan {
  if (current.state === "INVALIDATED_DRAFT") {
    return {
      kind: "conflict",
      status: 409,
      code: "DRAFT_INVALIDATED",
      message: "The source evidence changed after this draft was written; prepare a new draft",
    };
  }
  if (current.state === "DRAFT_PENDING_REVIEW") {
    if (request.decision === "approve" && !current.grounding.ok) {
      return {
        kind: "conflict",
        status: 422,
        code: "GROUNDING_FAILED",
        message: "This draft failed grounding checks and cannot be approved",
      };
    }
    return { kind: "apply", state: decided[request.decision] };
  }
  if (current.idempotencyKey === request.idempotencyKey && current.decision !== request.decision) {
    return {
      kind: "conflict",
      status: 409,
      code: "IDEMPOTENCY_KEY_REUSED",
      message: "This idempotency key already recorded a different decision",
    };
  }
  if (current.decision === request.decision) {
    return { kind: "replay" };
  }
  return {
    kind: "conflict",
    status: 409,
    code: "DECISION_CONFLICT",
    message: `This draft is already ${current.state}; a contradicting decision is refused`,
  };
}
