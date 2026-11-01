import type { ReactNode } from "react";

type SectionFrameProps = {
  id?: string;
  children: ReactNode;
  divider?: "dark" | "light" | "none";
  className?: string;
};

export function SectionFrame({
  id,
  children,
  divider = "dark",
  className = "",
}: SectionFrameProps) {
  return (
    <section id={id} className={`scroll-mt-24 px-4 sm:px-5 md:px-6 lg:px-8 ${className}`}>
      {divider === "none" ? null : (
        <div className={`h-px ${divider === "dark" ? "bg-white/12" : "bg-line"}`} />
      )}
      {children}
    </section>
  );
}
