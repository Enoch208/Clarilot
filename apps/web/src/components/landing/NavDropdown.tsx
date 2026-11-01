import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { Link } from "react-router";
import type { NavGroup, NavLinkItem } from "./nav-items";

function ItemLink({ item }: { item: NavLinkItem }) {
  const body = (
    <>
      <span className="block text-[1rem] leading-[1.2] font-normal text-ink">{item.label}</span>
      <span className="mt-1 block type-small text-mute">{item.detail}</span>
    </>
  );
  const classes = "block rounded-btn px-3 py-2.5 transition-colors hover:bg-mist";
  if (item.to.startsWith("http")) {
    return (
      <a href={item.to} target="_blank" rel="noreferrer" className={classes}>
        {body}
      </a>
    );
  }
  if (item.to.startsWith("#")) {
    return (
      <a href={item.to} className={classes}>
        {body}
      </a>
    );
  }
  return (
    <Link to={item.to} className={classes}>
      {body}
    </Link>
  );
}

export function NavDropdown({ group }: { group: NavGroup }) {
  return (
    <div className="group/nav relative">
      <button
        type="button"
        className="flex items-center gap-1.5 py-4 text-[16px] leading-none font-normal text-ink"
        aria-haspopup="true"
      >
        {group.label}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={12}
          strokeWidth={1.5}
          className="transition-transform duration-200 ease-[ease] group-focus-within/nav:rotate-180 group-hover/nav:rotate-180"
          aria-hidden="true"
        />
      </button>
      <div className="invisible absolute top-full left-[-0.75rem] z-10 w-[18rem] translate-y-[3rem] rounded-bar border border-line bg-white p-2 opacity-0 [transition:translate_300ms_ease,opacity_200ms_ease,visibility_200ms] group-focus-within/nav:visible group-focus-within/nav:translate-y-0 group-focus-within/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 group-hover/nav:opacity-100">
        {group.items.map((item) => (
          <ItemLink key={item.label} item={item} />
        ))}
      </div>
    </div>
  );
}
