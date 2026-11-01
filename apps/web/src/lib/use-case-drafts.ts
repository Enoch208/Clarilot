import { useState } from "react";
import {
  alertDetailResponseSchema,
  draftSchema,
  type Alert,
  type Draft,
  type ReviewDecision,
} from "@clarilot/core";
import { postJson } from "./api";
import { useResource } from "./use-resource";

export function useCaseDrafts(alert: Alert | null) {
  const path = alert === null ? null : `/api/alerts/${String(alert.dispense.dispenseId)}`;
  const { resource: detail, reload } = useResource(path, alertDetailResponseSchema);
  const [busy, setBusy] = useState<"draft" | "decision" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const drafts: Draft[] =
    alert !== null &&
    detail.state === "ready" &&
    detail.data.status !== "SOURCE_UNAVAILABLE" &&
    "drafts" in detail.data
      ? detail.data.drafts.filter((draft) => draft.recallNumber === alert.recall.recallNumber)
      : [];

  const run = async (kind: "draft" | "decision", action: () => Promise<Draft>) => {
    setBusy(kind);
    setActionError(null);
    try {
      await action();
      reload();
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  };

  const create = () => {
    if (alert === null) return;
    void run("draft", () =>
      postJson(
        `/api/alerts/${String(alert.dispense.dispenseId)}/draft`,
        { recallNumber: alert.recall.recallNumber },
        draftSchema,
      ),
    );
  };

  const decide = (draftId: string, decision: ReviewDecision, reviewerLabel: string) => {
    void run("decision", () =>
      postJson(
        `/api/drafts/${draftId}/decision`,
        { decision, reviewerLabel, idempotencyKey: crypto.randomUUID() },
        draftSchema,
      ),
    );
  };

  return { detail, drafts, busy, actionError, create, decide };
}
