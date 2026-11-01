import { useState } from "react";
import {
  demoCasesResponseSchema,
  demoInsertResponseSchema,
  demoResetResponseSchema,
  demoTokenHeader,
} from "@clarilot/core";
import { postJson } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

const tokenKey = "clarilot-demo-token";

type DemoControlsProps = {
  onChanged: () => void;
};

export function DemoControls({ onChanged }: DemoControlsProps) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(() => sessionStorage.getItem(tokenKey) ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { resource, reload } = useResource(
    open ? "/api/demo/cases" : null,
    demoCasesResponseSchema,
  );

  const act = async (action: () => Promise<string>) => {
    setBusy(true);
    sessionStorage.setItem(tokenKey, token);
    try {
      setMessage(await action());
      reload();
      onChanged();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const insert = (demoCaseId: string) => {
    void act(async () => {
      const result = await postJson(
        "/api/demo/insert-case",
        { demoCaseId },
        demoInsertResponseSchema,
        {
          [demoTokenHeader]: token,
        },
      );
      return `${result.note} Dispense #${String(result.dispenseId)}. Rerun the same query to see it.`;
    });
  };

  const reset = () => {
    void act(async () => {
      const result = await postJson("/api/demo/reset", {}, demoResetResponseSchema, {
        [demoTokenHeader]: token,
      });
      return `Reset: removed ${String(result.removedDispenseIds.length)} demo dispenses and ${String(result.removedDrafts)} drafts.`;
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
        }}
        aria-expanded={open}
        className="h-full rounded-card border border-line bg-white px-4 py-3 text-[0.875rem] text-ink hover:bg-white/70"
      >
        Demo controls
      </button>
      {open ? (
        <div className="absolute right-0 bottom-full z-20 mb-2 flex w-[24rem] flex-col gap-3 rounded-card border border-line bg-white p-4 shadow-[0_12px_40px_rgb(19_23_29/0.12)]">
          <p className="text-[0.8125rem] text-mute">
            Writes one allowlisted synthetic row to the pharmacy Postgres source. It does not touch
            FDA or CSV data and does not restart anything.
          </p>
          <input
            type="password"
            value={token}
            onChange={(event) => {
              setToken(event.target.value);
            }}
            placeholder="Demo token"
            aria-label="Demo token"
            className="rounded-btn border border-line px-2 py-1.5 text-[0.875rem] focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          />
          {resource.state === "loading" ? (
            <p className="text-[0.8125rem] text-mute">Loading demo cases…</p>
          ) : null}
          {resource.state === "error" ? (
            <p className="text-[0.8125rem] text-critical">{resource.message}</p>
          ) : null}
          {resource.state === "ready" && !resource.data.demoMode ? (
            <p className="text-[0.8125rem] text-caution">Demo mode is off on this server.</p>
          ) : null}
          {resource.state === "ready" && resource.data.demoMode
            ? resource.data.cases.map((demoCase) => (
                <div
                  key={demoCase.demoCaseId}
                  className="flex items-center justify-between gap-2 rounded-btn bg-mist p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[0.8125rem] text-ink">{demoCase.label}</p>
                    <p className="font-mono text-[0.72rem] text-mute">
                      dispense #{demoCase.dispenseId} · {demoCase.recallNumber}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy || demoCase.inserted || token.length === 0}
                    onClick={() => {
                      insert(demoCase.demoCaseId);
                    }}
                    className="shrink-0 rounded-btn bg-accent px-2.5 py-1.5 text-[0.8125rem] text-white disabled:opacity-50"
                  >
                    {demoCase.inserted ? "Inserted" : "Insert row"}
                  </button>
                </div>
              ))
            : null}
          <button
            type="button"
            disabled={busy || token.length === 0}
            onClick={reset}
            className="self-start rounded-btn border border-ink px-2.5 py-1.5 text-[0.8125rem] text-ink hover:bg-ink hover:text-white disabled:opacity-50"
          >
            Reset demo rows
          </button>
          {message === null ? null : <p className="text-[0.8125rem] text-ink">{message}</p>}
        </div>
      ) : null}
    </div>
  );
}
