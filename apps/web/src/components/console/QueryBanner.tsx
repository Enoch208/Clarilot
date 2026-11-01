import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, CheckmarkCircle02Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import type { AlertsResponse, QueryFailure } from "@clarilot/core";
import { formatStamp } from "@/lib/format";
import { isQueryFailure } from "@/lib/query-state";

type QueryBannerProps = {
  response: AlertsResponse;
};

export function QueryBanner({ response }: QueryBannerProps) {
  if (isQueryFailure(response)) return <FailureBanner response={response} />;
  if (response.status === "RESULTS") return null;
  if (response.status === "EMPTY_VERIFIED") {
    return (
      <div className="m-4 flex gap-3 rounded-btn bg-accent-soft p-3 text-[0.875rem] text-accent">
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          size={18}
          strokeWidth={1.6}
          className="shrink-0"
        />
        <p>
          No matching dispensing records in the verified scope ({response.coverage.recallScope}).
          This covers the selected recall subset only.
        </p>
      </div>
    );
  }
  return (
    <div className="m-4 flex gap-3 rounded-btn bg-caution-soft p-3 text-[0.875rem] text-caution">
      <HugeiconsIcon icon={Clock01Icon} size={18} strokeWidth={1.6} className="shrink-0" />
      <p>
        Snapshot results, not live. Taken{" "}
        {response.snapshotTakenAt === null
          ? "at an unknown time"
          : formatStamp(response.snapshotTakenAt)}
        .
      </p>
    </div>
  );
}

function FailureBanner({ response }: { response: QueryFailure }) {
  return (
    <div
      className="m-4 flex gap-3 rounded-btn bg-critical-soft p-3 text-[0.875rem] text-critical"
      role="alert"
    >
      <HugeiconsIcon icon={Alert02Icon} size={18} strokeWidth={1.6} className="shrink-0" />
      <div className="flex flex-col gap-1">
        <p className="font-normal">
          Verification could not complete: {response.status.replaceAll("_", " ").toLowerCase()}
          {response.failedSource === null ? "" : ` (${response.failedSource})`}.
        </p>
        <p>{response.reason}</p>
        <p>This is not an empty result. No previous results are shown as current.</p>
        <p className="font-mono text-[0.72rem] opacity-80">
          query {response.queryId} · {formatStamp(response.checkedAt)}
        </p>
      </div>
    </div>
  );
}
