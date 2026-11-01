type TagPillProps = {
  label: string;
};

export function TagPill({ label }: TagPillProps) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-pill bg-mist px-2.5 py-[5px] type-tag text-ink">
      <svg viewBox="0 0 11 13" className="h-[0.8em] w-[0.7em] shrink-0" aria-hidden="true">
        <path d="M5.5 0.5L10.5 6.5L5.5 12.5L0.5 6.5Z" fill="currentColor" />
      </svg>
      <span className="font-medium">{label}</span>
    </div>
  );
}
