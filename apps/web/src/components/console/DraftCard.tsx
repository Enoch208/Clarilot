import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  InformationCircleIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import type { Draft, DraftState, ReviewDecision } from "@clarilot/core";
import type { BadgeSpec } from "@/lib/evidence";
import { Badge } from "./Badge";

export const draftBadges: Record<DraftState, BadgeSpec> = {
  DRAFT_PENDING_REVIEW: { label: "Pending review", tone: "caution", icon: Clock01Icon },
  APPROVED_DRAFT: { label: "Draft approved", tone: "ok", icon: CheckmarkCircle02Icon },
  REJECTED_DRAFT: { label: "Draft rejected", tone: "critical", icon: Alert02Icon },
  INVALIDATED_DRAFT: { label: "Invalidated", tone: "mute", icon: InformationCircleIcon },
};

type DraftCardProps = {
  draft: Draft;
  busy: boolean;
  onDecide: (decision: ReviewDecision, reviewerLabel: string) => void;
};

export function DraftCard({ draft, busy, onDecide }: DraftCardProps) {
  const [reviewer, setReviewer] = useState("Demo pharmacist");
  const pending = draft.state === "DRAFT_PENDING_REVIEW";
  const canApprove = pending && draft.grounding.ok && reviewer.trim().length > 0 && !busy;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge spec={draftBadges[draft.state]} size="md" />
        <span className="rounded-pill bg-mist px-2 py-1 text-[0.75rem] leading-none text-ink">
          {draft.generator === "template"
            ? "Safe template"
            : `Model draft · ${draft.modelName ?? "unknown model"}`}
        </span>
        <span className="rounded-pill bg-mist px-2 py-1 text-[0.75rem] leading-none text-ink">
          Not sent
        </span>
      </div>
      <blockquote className="rounded-btn bg-mist p-3 text-[0.9375rem] leading-[1.45] whitespace-pre-wrap text-ink">
        {draft.content.draftText}
      </blockquote>
      <div>
        <p className="type-tag text-mute">Pharmacist note</p>
        <p className="mt-1 text-[0.875rem] leading-[1.4] text-ink">
          {draft.content.pharmacistNote}
        </p>
      </div>
      <div>
        <p className="type-tag text-mute">
          Grounding {draft.grounding.ok ? "passed" : "failed"} · {draft.grounding.checks.length}{" "}
          checks
        </p>
        <ul className="mt-1 flex flex-col gap-1">
          {draft.grounding.checks.map((check) => (
            <li
              key={check.check}
              className={`flex gap-1.5 text-[0.8125rem] ${check.ok ? "text-ink" : "text-critical"}`}
            >
              <HugeiconsIcon
                icon={check.ok ? Tick02Icon : Cancel01Icon}
                size={14}
                strokeWidth={1.8}
                className="mt-[0.15rem] shrink-0"
              />
              <span>
                {check.check}: <span className="text-mute">{check.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      {pending ? (
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <label className="type-tag text-mute" htmlFor="reviewer">
            Reviewer
          </label>
          <input
            id="reviewer"
            value={reviewer}
            onChange={(event) => {
              setReviewer(event.target.value);
            }}
            maxLength={80}
            className="rounded-btn border border-line px-2 py-1.5 text-[0.875rem] focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          />
          {draft.grounding.ok ? null : (
            <p className="text-[0.8125rem] text-critical">
              Grounding failed, so this draft cannot be approved.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!canApprove}
              onClick={() => {
                onDecide("approve", reviewer.trim());
              }}
              className="flex-1 rounded-btn border border-accent bg-accent px-3 py-2 text-[0.875rem] leading-none text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Approve draft
            </button>
            <button
              type="button"
              disabled={busy || reviewer.trim().length === 0}
              onClick={() => {
                onDecide("reject", reviewer.trim());
              }}
              className="flex-1 rounded-btn border border-ink px-3 py-2 text-[0.875rem] leading-none text-ink hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject draft
            </button>
          </div>
          <p className="text-[0.75rem] text-mute">
            Approval changes the draft’s status only. No patient is contacted.
          </p>
        </div>
      ) : (
        <p className="text-[0.8125rem] text-mute">
          {draft.reviewerLabel ?? "Unknown reviewer"} ·{" "}
          {draft.decidedAt === null
            ? "no decision time"
            : draft.decidedAt.replace("T", " ").slice(0, 16)}{" "}
          UTC
        </p>
      )}
    </div>
  );
}
