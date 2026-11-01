type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className = "" }: BrandMarkProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M16 2.5C22.2 2.5 24.6 5.4 26.3 9.2C27.5 11.9 29.5 13.4 29.5 16C29.5 18.6 27.5 20.1 26.3 22.8C24.6 26.6 22.2 29.5 16 29.5C9.8 29.5 7.4 26.6 5.7 22.8C4.5 20.1 2.5 18.6 2.5 16C2.5 13.4 4.5 11.9 5.7 9.2C7.4 5.4 9.8 2.5 16 2.5Z"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path d="M11 16H21M16 11V21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type WordmarkProps = {
  className?: string;
};

export function Wordmark({ className = "" }: WordmarkProps) {
  return (
    <span
      className={`inline-flex items-center gap-[0.18em] font-light tracking-[-0.03em] ${className}`}
    >
      <BrandMark className="size-[0.9em]" />
      <span>Clarilot</span>
    </span>
  );
}
