import { HugeiconsIcon } from "@hugeicons/react";
import { toneClasses, type BadgeSpec } from "@/lib/evidence";

type BadgeProps = {
  spec: BadgeSpec;
  size?: "sm" | "md";
};

export function Badge({ spec, size = "sm" }: BadgeProps) {
  const sizing =
    size === "sm" ? "gap-1 px-1.5 py-[0.2rem] text-[0.75rem]" : "gap-1.5 px-2 py-1 text-[0.875rem]";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-pill leading-none font-normal whitespace-nowrap ${sizing} ${toneClasses[spec.tone]}`}
    >
      <HugeiconsIcon icon={spec.icon} size={size === "sm" ? 12 : 14} strokeWidth={1.8} />
      {spec.label}
    </span>
  );
}
