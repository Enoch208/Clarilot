import { useState, type SyntheticEvent } from "react";
import { ledgerEntrySchema } from "@clarilot/core";
import { useResource } from "@/lib/use-resource";
import { LedgerDetail } from "./LedgerDetail";

export function LedgerView({ currentQueryId }: { currentQueryId: string | null }) {
  const [input, setInput] = useState("");
  const [lookup, setLookup] = useState<string | null>(null);
  const queryId = lookup ?? currentQueryId;
  const { resource } = useResource(
    queryId === null ? null : `/api/ledger/${queryId}`,
    ledgerEntrySchema,
  );
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input.trim();
    setLookup(value.length > 0 ? value : null);
  };
  return (
    <section className="flex min-h-0 flex-col gap-4 overflow-y-auto rounded-card bg-ink p-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="type-h6">Query ledger</h2>
          <p className="text-[0.875rem] text-white/60">
            Every execution is recorded with its exact SQL, sources, timing and result, including
            failures.
          </p>
        </div>
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
            }}
            placeholder="Query ID"
            aria-label="Query ID"
            className="w-[20rem] rounded-btn bg-ink-2 px-3 py-2 font-mono text-[0.8125rem] text-white placeholder:font-sans placeholder:text-mute focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-btn border border-white px-3 py-2 text-[0.875rem] hover:bg-white hover:text-ink"
          >
            Look up
          </button>
        </form>
      </div>
      {queryId === null ? (
        <p className="text-white/60">Run the federated query, or paste a query ID.</p>
      ) : null}
      {queryId !== null && resource.state === "loading" ? (
        <p className="text-white/60">Loading {queryId}…</p>
      ) : null}
      {resource.state === "error" ? <p className="text-critical-soft">{resource.message}</p> : null}
      {resource.state === "ready" ? <LedgerDetail entry={resource.data} /> : null}
    </section>
  );
}
