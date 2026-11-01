import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, SecurityCheckIcon } from "@hugeicons/core-free-icons";
import { ledgerEntrySchema } from "@clarilot/core";
import { useResource } from "@/lib/use-resource";
import { LedgerDetail } from "./LedgerDetail";

type ProofDrawerProps = {
  queryId: string | null;
  summary: string;
};

export function ProofDrawer({ queryId, summary }: ProofDrawerProps) {
  const [open, setOpen] = useState(false);
  const { resource } = useResource(
    open && queryId !== null ? `/api/ledger/${queryId}` : null,
    ledgerEntrySchema,
  );
  return (
    <section className="rounded-card bg-ink text-white">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
        }}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <HugeiconsIcon
          icon={SecurityCheckIcon}
          size={18}
          strokeWidth={1.6}
          className="shrink-0 text-accent-soft"
        />
        <span className="text-[0.9375rem]">Proof</span>
        <span className="min-w-0 flex-1 truncate font-mono text-[0.75rem] text-white/60">
          {queryId === null ? "No query has run yet" : `query ${queryId} · ${summary}`}
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={16}
          strokeWidth={1.6}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="max-h-[45dvh] overflow-y-auto border-t border-white/10 p-4">
          {queryId === null ? (
            <p className="text-[0.875rem] text-white/60">Run the federated query first.</p>
          ) : null}
          {queryId !== null && resource.state === "loading" ? (
            <p className="text-[0.875rem] text-white/60">Loading the ledger entry…</p>
          ) : null}
          {resource.state === "error" ? (
            <p className="text-[0.875rem] text-critical-soft">
              The ledger entry could not be loaded: {resource.message}
            </p>
          ) : null}
          {resource.state === "ready" ? <LedgerDetail entry={resource.data} /> : null}
        </div>
      ) : null}
    </section>
  );
}
