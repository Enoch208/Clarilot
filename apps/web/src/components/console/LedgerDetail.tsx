import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import type { LedgerEntry } from "@clarilot/core";
import { formatStamp } from "@/lib/format";

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="type-tag text-white/50">{label}</dt>
      <dd className="font-mono text-[0.78rem] leading-[1.4] break-all text-white tabular">
        {value}
      </dd>
    </div>
  );
}

export function LedgerDetail({ entry }: { entry: LedgerEntry }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(entry.safeSql).then(() => {
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    });
  };
  const fetched = entry.fetchedAt === null ? [] : Object.entries(entry.fetchedAt);
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="relative min-w-0">
        <button
          type="button"
          onClick={copy}
          className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-btn border border-white/20 bg-ink px-2 py-1 text-[0.75rem] text-white hover:bg-ink-2"
        >
          <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={13} strokeWidth={1.6} />
          {copied ? "Copied" : "Copy executed SQL"}
        </button>
        <pre className="max-h-[30rem] overflow-auto rounded-btn bg-black/40 p-4 pt-10 font-mono text-[0.78rem] leading-[1.55] text-white/90">
          {entry.safeSql}
        </pre>
      </div>
      <dl className="grid grid-cols-2 content-start gap-x-4 gap-y-3">
        <Meta label="Query ID" value={entry.queryId} />
        <Meta label="Named query" value={entry.queryName} />
        <Meta label="Status" value={entry.executionStatus} />
        <Meta label="Executed" value={formatStamp(entry.createdAt)} />
        <Meta
          label="Latency"
          value={entry.latencyMs === null ? "unknown" : `${String(entry.latencyMs)} ms`}
        />
        <Meta label="Rows" value={entry.rowCount === null ? "unknown" : String(entry.rowCount)} />
        <Meta label="Cache mode" value={entry.cacheMode ?? "unknown"} />
        <Meta label="Principal" value={entry.zetarisPrincipal ?? "unknown"} />
        <div className="col-span-2">
          <Meta label="Sources referenced" value={entry.sourceNames.join(", ")} />
        </div>
        {fetched.map(([source, at]) => (
          <Meta key={source} label={`${source} fetched`} value={at ?? "unknown"} />
        ))}
        <div className="col-span-2">
          <Meta label="Statement SHA-256" value={entry.statementSha256} />
        </div>
        {entry.errorCode === null ? null : (
          <div className="col-span-2">
            <Meta label="Error" value={`${entry.errorCode}: ${entry.errorSummary ?? ""}`} />
          </div>
        )}
      </dl>
    </div>
  );
}
