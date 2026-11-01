import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare01Icon, QuillWrite01Icon } from "@hugeicons/core-free-icons";
import type { Alert } from "@clarilot/core";
import { classificationBadge, lotBadges, toneClasses } from "@/lib/evidence";
import { formatSourceDate } from "@/lib/format";
import { Badge } from "./Badge";
import { Block, DispenseBlock, MatchBlock, ReceivingBlock, ShortageBlock } from "./CaseSections";
import { caseGaps } from "./case-gaps";
import { Panel } from "./Panel";

type CaseViewProps = {
  alert: Alert | null;
  onPrepareDraft: () => void;
  drafting: boolean;
};

export function CaseView({ alert, onPrepareDraft, drafting }: CaseViewProps) {
  if (alert === null) {
    return (
      <Panel title="Selected case">
        <p className="p-5 text-[0.9375rem] text-mute">
          Select a case in the queue to see the recall, the dispensing record and the evidence
          behind the flag.
        </p>
      </Panel>
    );
  }
  const spec = lotBadges[alert.lot.level];
  const gaps = caseGaps(alert);
  return (
    <Panel
      title="Selected case"
      aside={<span className="font-mono text-[0.75rem] text-mute">{alert.caseKey}</span>}
    >
      <div className="flex flex-col gap-3 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[1.125rem] text-ink tabular">
            {alert.recall.recallNumber}
          </span>
          <Badge spec={classificationBadge(alert.recall.classification)} size="md" />
          <span className="text-[0.8125rem] text-mute">
            {alert.recall.recallStatus} · reported {formatSourceDate(alert.recall.reportDate)} ·{" "}
            {alert.recall.recallingFirm}
          </span>
        </div>
        <h3 className="type-h6 text-ink">{alert.recall.productDescription}</h3>
        <div className="flex flex-wrap gap-2">
          <a
            href={alert.recall.permalink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-btn border border-ink px-3 py-2 text-[0.875rem] leading-none text-ink transition-colors hover:bg-ink hover:text-white"
          >
            Official record on openFDA
            <HugeiconsIcon icon={LinkSquare01Icon} size={14} strokeWidth={1.6} />
          </a>
          <button
            type="button"
            onClick={onPrepareDraft}
            disabled={drafting}
            className="inline-flex items-center gap-1.5 rounded-btn border border-accent bg-accent px-3 py-2 text-[0.875rem] leading-none text-white transition-colors hover:bg-accent-hover disabled:cursor-wait disabled:opacity-70"
          >
            <HugeiconsIcon icon={QuillWrite01Icon} size={14} strokeWidth={1.6} />
            {drafting ? "Preparing draft…" : "Prepare review draft"}
          </button>
        </div>
      </div>
      <div className={`mx-5 mb-4 flex flex-col gap-1 rounded-btn p-3 ${toneClasses[spec.tone]}`}>
        <Badge spec={spec} size="md" />
        <p className="mt-1 text-[0.9375rem] leading-[1.35]">{alert.lot.conclusion}</p>
        <p className="text-[0.8125rem] opacity-90">{alert.lot.reason}</p>
        <p className="text-[0.8125rem] opacity-90">
          Pharmacist review required. The software does not decide exposure.
        </p>
      </div>
      <Block title="Lot text as published by FDA (code_info)">
        <pre className="rounded-btn bg-mist p-3 font-mono text-[0.8125rem] leading-[1.5] whitespace-pre-wrap text-ink">
          {alert.recall.codeInfo.length === 0
            ? "(empty in the source record)"
            : alert.recall.codeInfo}
        </pre>
        <p className="mt-3 text-[0.875rem] text-ink">
          <span className="text-mute">Reason for recall: </span>
          {alert.recall.reasonForRecall}
        </p>
      </Block>
      <MatchBlock alert={alert} />
      <Block title="Missing or unverified">
        {gaps.length === 0 ? (
          <p className="text-[0.875rem] text-mute">
            No gaps detected in the fields Clarilot checks.
          </p>
        ) : (
          <ul className="flex list-disc flex-col gap-1 pl-5 text-[0.875rem] text-caution">
            {gaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        )}
      </Block>
      <DispenseBlock alert={alert} />
      <ReceivingBlock alert={alert} />
      <ShortageBlock alert={alert} />
    </Panel>
  );
}
