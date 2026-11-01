import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { Wordmark } from "@/components/ui/BrandMark";
import { consoleViews, type ConsoleView } from "./views";

type ConsoleHeaderProps = {
  view: ConsoleView;
  onView: (view: ConsoleView) => void;
  onRun: () => void;
  running: boolean;
};

export function ConsoleHeader({ view, onView, onRun, running }: ConsoleHeaderProps) {
  return (
    <header className="flex min-h-[3.47rem] flex-wrap items-center gap-x-6 gap-y-2 rounded-bar border border-line bg-white py-2 pr-[0.625rem] pl-4">
      <Link
        to="/"
        className="flex items-center gap-3 text-[1.6rem] text-ink"
        aria-label="Clarilot home"
      >
        <Wordmark />
        <span className="hidden text-[0.875rem] text-mute xl:inline">/ Recall intelligence</span>
      </Link>
      <nav className="flex flex-1 flex-wrap items-center gap-1" aria-label="Console views">
        {consoleViews.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onView(item.id);
            }}
            aria-current={view === item.id ? "page" : undefined}
            className={`rounded-btn px-3 py-2 text-[0.9375rem] leading-none font-normal transition-colors ${
              view === item.id ? "bg-ink text-white" : "text-ink hover:bg-mist"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <span className="rounded-pill border border-caution/30 bg-caution-soft px-2.5 py-1.5 text-[0.75rem] leading-none font-medium tracking-[0.04em] text-caution">
          SYNTHETIC PHARMACY DATA
        </span>
        <button
          type="button"
          onClick={onRun}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-btn border border-accent bg-accent px-3 py-2 text-[0.875rem] leading-[1.2] font-normal tracking-[-0.02em] text-white transition-colors hover:bg-accent-hover disabled:cursor-wait disabled:opacity-70"
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            size={14}
            strokeWidth={1.8}
            className={running ? "animate-spin" : ""}
          />
          {running ? "Querying Zetaris…" : "Run federated query"}
        </button>
      </div>
    </header>
  );
}
