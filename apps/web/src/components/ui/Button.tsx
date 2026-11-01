import type { ReactNode } from "react";
import { Link } from "react-router";
import { SlideArrow } from "./SlideArrow";

type Variant = "primary" | "outline-light" | "outline-dark";

const base =
  "group inline-flex items-center gap-2 rounded-btn border px-3 py-2 text-[0.875rem] leading-[1.2] font-normal tracking-[-0.02em] whitespace-nowrap transition-all duration-250 max-sm:text-[0.8rem]";

const variants: Record<Variant, string> = {
  primary: "border-accent bg-accent text-white hover:border-accent-hover hover:bg-accent-hover",
  "outline-light": "border-white text-white hover:bg-white hover:text-ink",
  "outline-dark": "border-ink text-ink hover:bg-ink hover:text-white",
};

type ButtonLinkProps = {
  to: string;
  children: ReactNode;
  variant?: Variant;
  arrow?: boolean;
  icon?: ReactNode;
  external?: boolean;
  className?: string;
};

export function ButtonLink({
  to,
  children,
  variant = "primary",
  arrow = false,
  icon,
  external = false,
  className = "",
}: ButtonLinkProps) {
  const classes = `${base} ${variants[variant]} ${className}`;
  const content = (
    <>
      <span>{children}</span>
      {arrow ? <SlideArrow /> : icon}
    </>
  );
  if (external || to.startsWith("#") || to.startsWith("http")) {
    return (
      <a
        href={to}
        className={classes}
        {...(to.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {content}
      </a>
    );
  }
  return (
    <Link to={to} className={classes}>
      {content}
    </Link>
  );
}

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  arrow?: boolean;
  icon?: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
};

export function Button({
  children,
  onClick,
  variant = "primary",
  arrow = false,
  icon,
  type = "button",
  disabled = false,
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <span>{children}</span>
      {arrow ? <SlideArrow /> : icon}
    </button>
  );
}
