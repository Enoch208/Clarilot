import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";

export function SlideArrow() {
  return (
    <span className="relative block size-[1em] shrink-0 overflow-hidden" aria-hidden="true">
      <HugeiconsIcon
        icon={ArrowRight02Icon}
        strokeWidth={1.5}
        className="absolute inset-0 size-full transition-transform duration-300 ease-patch group-hover:translate-x-full"
      />
      <HugeiconsIcon
        icon={ArrowRight02Icon}
        strokeWidth={1.5}
        className="absolute inset-0 size-full -translate-x-full transition-transform duration-300 ease-patch group-hover:translate-x-0"
      />
    </span>
  );
}
