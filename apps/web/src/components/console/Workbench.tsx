import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import type { Alert } from "@clarilot/core";
import type { useCaseDrafts } from "@/lib/use-case-drafts";
import { Badge } from "./Badge";
import { DraftCard, draftBadges } from "./DraftCard";
import { Panel } from "./Panel";

type WorkbenchProps = {
  alert: Alert | null;
  drafts: ReturnType<typeof useCaseDrafts>;
};

function Body({ alert, drafts }: WorkbenchProps) {
  if (alert === null) {
    return <p className="text-[0.875rem] text-mute">Select a case to review its drafts.</p>;
  }
  if (drafts.detail.state === "loading") {
    return (
      <p className="text-[0.875rem] text-mute">
        Loading drafts for dispense #{alert.dispense.dispenseId}…
      </p>
    );
  }
  if (drafts.detail.state === "error") {
    return (
      <p className="text-[0.875rem] text-critical">
        Drafts could not be loaded: {drafts.detail.message}
      </p>
    );
  }
  if (
    drafts.detail.data.status === "SOURCE_UNAVAILABLE" ||
    drafts.detail.data.status === "ACCESS_DENIED" ||
    drafts.detail.data.status === "TIMEOUT"
  ) {
    return (
      <p className="text-[0.875rem] text-critical">
        Case detail unavailable: {drafts.detail.data.reason}
      </p>
    );
  }
  const [latest, ...history] = [...drafts.drafts].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  if (!latest) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[0.875rem] text-mute">No draft yet for {alert.recall.recallNumber}.</p>
        <button
          type="button"
          onClick={drafts.create}
          disabled={drafts.busy !== null}
          className="self-start rounded-btn border border-accent bg-accent px-3 py-2 text-[0.875rem] leading-none text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {drafts.busy === "draft" ? "Preparing draft…" : "Prepare review draft"}
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      <DraftCard
        key={latest.draftId}
        draft={latest}
        busy={drafts.busy !== null}
        onDecide={(decision, reviewer) => {
          drafts.decide(latest.draftId, decision, reviewer);
        }}
      />
      {history.length > 0 ? (
        <div className="border-t border-line pt-3">
          <p className="type-tag text-mute">History</p>
          <ul className="mt-2 flex flex-col gap-2">
            {history.map((draft) => (
              <li
                key={draft.draftId}
                className="flex flex-wrap items-center gap-2 text-[0.8125rem] text-mute"
              >
                <Badge spec={draftBadges[draft.state]} />
                <span className="font-mono tabular">
                  {draft.createdAt.replace("T", " ").slice(0, 16)}
                </span>
                <span>{draft.reviewerLabel ?? ""}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function Workbench({ alert, drafts }: WorkbenchProps) {
  return (
    <Panel title="Pharmacist workbench">
      <div className="flex flex-col gap-4 p-4">
        <p className="flex gap-2 rounded-btn bg-mist p-3 text-[0.8125rem] leading-[1.4] text-ink">
          <HugeiconsIcon
            icon={InformationCircleIcon}
            size={16}
            strokeWidth={1.6}
            className="mt-[0.1rem] shrink-0"
          />
          Drafts are prepared for pharmacist review. Clarilot never sends a message or changes a
          medication.
        </p>
        {drafts.actionError === null ? null : (
          <p
            className="rounded-btn bg-critical-soft p-3 text-[0.8125rem] text-critical"
            role="alert"
          >
            {drafts.actionError}
          </p>
        )}
        <Body alert={alert} drafts={drafts} />
      </div>
    </Panel>
  );
}
