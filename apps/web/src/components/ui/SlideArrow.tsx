const arrowPath = (
  <>
    <path d="M2.33 8.33H13.33" stroke="currentColor" strokeLinecap="square" />
    <path d="M7.67 2.33L13.67 8.33L7.67 14.33" stroke="currentColor" strokeLinecap="square" />
  </>
);

export function SlideArrow() {
  return (
    <span className="relative block size-[1em] shrink-0 overflow-hidden" aria-hidden="true">
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className="absolute inset-0 size-full transition-transform duration-300 ease-patch group-hover:translate-x-full"
      >
        {arrowPath}
      </svg>
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className="absolute inset-0 size-full -translate-x-full transition-transform duration-300 ease-patch group-hover:translate-x-0"
      >
        {arrowPath}
      </svg>
    </span>
  );
}
