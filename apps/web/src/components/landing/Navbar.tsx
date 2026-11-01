import { useState } from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Menu01Icon, SourceCodeIcon } from "@hugeicons/core-free-icons";
import { ButtonLink } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/BrandMark";
import { links } from "@/lib/links";
import { NavDropdown } from "./NavDropdown";
import { navGroups } from "./nav-items";

function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="mt-2 rounded-bar border border-line bg-white p-4 lg:hidden">
      {navGroups.map((group) => (
        <div key={group.label} className="border-b border-line py-3 last:border-b-0">
          <p className="type-tag text-mute">{group.label}</p>
          {group.items.map((item) => (
            <a
              key={item.label}
              href={item.to}
              onClick={onClose}
              className="block py-1.5 text-[1.125rem] font-normal text-ink"
              {...(item.to.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              {item.label}
            </a>
          ))}
        </div>
      ))}
      <div className="pt-4">
        <ButtonLink to="/console" arrow>
          Open console
        </ButtonLink>
      </div>
    </div>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-2 pt-2 lg:px-8 lg:pt-[1.5rem]">
      <div className="flex h-[3.125rem] items-center justify-between gap-2 rounded-bar border border-line bg-white pr-3 pl-3 lg:h-[3.47rem] lg:pr-[0.625rem] lg:pl-4">
        <Link
          to="/"
          aria-label="Clarilot home"
          className="py-1 text-[1.6rem] text-ink lg:text-[1.75rem]"
        >
          <Wordmark />
        </Link>
        <nav
          className="ml-[4.25rem] hidden flex-1 items-center gap-[1.65rem] lg:flex"
          aria-label="Main"
        >
          {navGroups.map((group) => (
            <NavDropdown key={group.label} group={group} />
          ))}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          <a
            href={links.repo}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[16px] leading-none font-normal text-ink"
          >
            <HugeiconsIcon icon={SourceCodeIcon} size={15} strokeWidth={1.5} />
            Source
          </a>
          <ButtonLink to="/console" arrow className="text-[16px]! py-[0.55rem]">
            Open console
          </ButtonLink>
        </div>
        <button
          type="button"
          className="grid size-9 place-items-center text-ink lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => {
            setOpen((value) => !value);
          }}
        >
          <HugeiconsIcon icon={open ? Cancel01Icon : Menu01Icon} size={22} strokeWidth={1.5} />
        </button>
      </div>
      {open ? (
        <MobileMenu
          onClose={() => {
            setOpen(false);
          }}
        />
      ) : null}
    </header>
  );
}
