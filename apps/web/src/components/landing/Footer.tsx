import { HugeiconsIcon } from "@hugeicons/react";
import { GithubIcon } from "@hugeicons/core-free-icons";
import { BrandMark } from "@/components/ui/BrandMark";
import { links } from "@/lib/links";
import { footerColumns } from "./footer-links";
import { RecallLookup } from "./RecallLookup";

function FooterLink({ label, to }: { label: string; to: string }) {
  const external = to.startsWith("http");
  return (
    <a
      href={to}
      className="block py-2 text-[1rem] font-normal text-white transition-opacity hover:opacity-60"
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {label}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="px-4 sm:px-5 md:px-6 lg:px-8">
      <div className="flex flex-col gap-6 pt-[7rem] pb-8 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="type-h5 text-white">Look up a published recall</h2>
        <RecallLookup />
      </div>
      <div className="h-px bg-white/12" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 pt-[4.5rem] pb-[5rem] lg:grid-cols-4">
        {footerColumns.map((column) => (
          <div key={column.title}>
            <p className="border-b border-ink-2 pb-[1.75rem] text-[1rem] font-normal text-mute">
              {column.title}
            </p>
            <div className="pt-[1.25rem]">
              {column.items.map((item) => (
                <FooterLink key={item.label} label={item.label} to={item.to} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="h-px bg-white/12" />
      <div
        className="flex items-center gap-[2vw] overflow-hidden py-[3.5rem] text-white"
        aria-label="Clarilot"
      >
        <BrandMark className="w-[20.5vw] shrink-0" />
        <span className="text-[25.4vw] leading-[0.8] font-light tracking-[-0.05em]">Clarilot</span>
      </div>
      <div className="h-px bg-white/12" />
      <div className="flex flex-col gap-4 pt-[1.5rem] pb-[2rem] text-mute md:flex-row md:items-center md:justify-between">
        <p>© 2026 Clarilot. Synthetic data prototype.</p>
        <p className="font-normal">Not clinical advice</p>
        <p className="font-normal">No patient is ever contacted</p>
        <a
          href={links.repo}
          target="_blank"
          rel="noreferrer"
          className="text-white"
          aria-label="Clarilot on GitHub"
        >
          <HugeiconsIcon icon={GithubIcon} size={26} strokeWidth={1.5} />
        </a>
      </div>
    </footer>
  );
}
