import type { ReactNode } from "react";

type PanelProps = {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Panel({ title, aside, children, className = "" }: PanelProps) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-card border border-line bg-white ${className}`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="text-[1rem] leading-none font-normal tracking-[-0.01em] text-ink">
          {title}
        </h2>
        {aside}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </section>
  );
}

type FieldProps = {
  label: string;
  children: ReactNode;
  mono?: boolean;
};

export function Field({ label, children, mono = false }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="type-tag text-mute">{label}</dt>
      <dd
        className={`text-[0.9375rem] leading-[1.35] text-ink ${mono ? "font-mono text-[0.85rem] tabular" : ""}`}
      >
        {children}
      </dd>
    </div>
  );
}
