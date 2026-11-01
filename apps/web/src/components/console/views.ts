export const consoleViews = [
  { id: "investigations", label: "Investigations" },
  { id: "quality", label: "Data quality" },
  { id: "sources", label: "Sources" },
  { id: "ledger", label: "Query ledger" },
] as const;

export type ConsoleView = (typeof consoleViews)[number]["id"];

export function parseView(value: string | null): ConsoleView {
  const match = consoleViews.find((view) => view.id === value);
  return match ? match.id : "investigations";
}
