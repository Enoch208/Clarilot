import { useState, type SyntheticEvent } from "react";
import { SlideArrow } from "@/components/ui/SlideArrow";
import { recallLookupUrl } from "@/lib/links";

export function RecallLookup() {
  const [value, setValue] = useState("");
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (value.trim().length === 0) return;
    window.open(recallLookupUrl(value), "_blank", "noopener,noreferrer");
  };
  return (
    <form onSubmit={submit} className="flex w-full gap-2 lg:w-auto">
      <label htmlFor="recall-lookup" className="sr-only">
        Recall number
      </label>
      <input
        id="recall-lookup"
        value={value}
        onChange={(event) => {
          setValue(event.target.value.toUpperCase());
        }}
        placeholder="Recall number, e.g. D-0123-2026"
        className="h-[2.55rem] min-w-0 flex-1 rounded-btn bg-ink-2 px-3 font-mono text-[0.875rem] text-white placeholder:font-sans placeholder:text-mute focus:outline-none focus-visible:ring-1 focus-visible:ring-accent lg:w-[17.4rem] lg:flex-none"
      />
      <button
        type="submit"
        className="group inline-flex h-[2.55rem] items-center gap-2 rounded-btn border border-accent bg-accent px-3 text-[0.875rem] font-normal tracking-[-0.02em] text-white transition-colors hover:bg-accent-hover"
      >
        Look up
        <SlideArrow />
      </button>
    </form>
  );
}
