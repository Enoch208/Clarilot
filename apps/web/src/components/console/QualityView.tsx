import { quarantineResponseSchema } from "@clarilot/core";
import { useResource } from "@/lib/use-resource";
import { Panel } from "./Panel";

export function QualityView() {
  const { resource, reload } = useResource("/api/quarantine", quarantineResponseSchema);
  return (
    <Panel
      title="Data quality"
      aside={
        <button
          type="button"
          onClick={reload}
          className="text-[0.8125rem] text-accent underline-offset-4 hover:underline"
        >
          Re-run checks
        </button>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        <p className="text-[0.875rem] text-mute">
          Rows that fail a rule stay visible here. A failing row is never treated as safe and never
          silently removed from the investigation count.
        </p>
        {resource.state === "loading" ? (
          <p className="text-[0.875rem] text-mute">Running validation rules…</p>
        ) : null}
        {resource.state === "error" ? (
          <p className="rounded-btn bg-critical-soft p-3 text-[0.875rem] text-critical">
            {resource.message}
          </p>
        ) : null}
        {resource.state === "ready" && resource.data.status === "SOURCE_UNAVAILABLE" ? (
          <p className="rounded-btn bg-critical-soft p-3 text-[0.875rem] text-critical">
            Validation could not run: {resource.data.reason}
          </p>
        ) : null}
        {resource.state === "ready" && resource.data.status !== "SOURCE_UNAVAILABLE" ? (
          <>
            <p className="rounded-btn bg-mist p-3 text-[0.8125rem] text-ink">
              Engine: <span className="font-mono">{resource.data.engine}</span>.{" "}
              {resource.data.engineNote}
            </p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {resource.data.rules.map((rule) => (
                <div key={rule.rule} className="rounded-btn border border-line p-3">
                  <p className="font-mono text-[0.8125rem] text-ink">{rule.rule}</p>
                  <p
                    className={`mt-1 text-[1.5rem] leading-none ${rule.failing > 0 ? "text-caution" : "text-accent"}`}
                  >
                    {rule.failing}
                    <span className="ml-1 text-[0.8125rem] text-mute">failing</span>
                  </p>
                  <p className="mt-2 text-[0.8125rem] text-mute">{rule.description}</p>
                  <p className="mt-1 text-[0.8125rem] text-ink">{rule.action}</p>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto rounded-btn border border-line">
              <table className="w-full text-left text-[0.8125rem]">
                <thead className="bg-mist text-mute">
                  <tr>
                    {["Rule", "Dispense", "NDC (raw)", "Lot", "Dispensed at", "Why"].map((head) => (
                      <th key={head} className="px-3 py-2 font-normal">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {resource.data.rows.map((row) => (
                    <tr key={`${row.rule}-${String(row.dispenseId)}`}>
                      <td className="px-3 py-2 font-mono">{row.rule}</td>
                      <td className="px-3 py-2 font-mono tabular">#{row.dispenseId}</td>
                      <td className="px-3 py-2 font-mono">{row.productNdcRaw}</td>
                      <td className="px-3 py-2 font-mono">{row.lotNo ?? "missing"}</td>
                      <td className="px-3 py-2 font-mono tabular">
                        {row.dispensedAt.replace("T", " ").slice(0, 16)}
                      </td>
                      <td className="px-3 py-2 text-ink">{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </Panel>
  );
}
