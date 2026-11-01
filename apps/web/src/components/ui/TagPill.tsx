import { HugeiconsIcon } from "@hugeicons/react";
import { Diamond01Icon } from "@hugeicons/core-free-icons";

type TagPillProps = {
  label: string;
};

export function TagPill({ label }: TagPillProps) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-pill bg-mist px-2.5 py-[5px] type-tag text-ink">
      <HugeiconsIcon
        icon={Diamond01Icon}
        fill="currentColor"
        className="size-[0.9em] shrink-0"
        aria-hidden="true"
      />
      <span className="font-medium">{label}</span>
    </div>
  );
}
