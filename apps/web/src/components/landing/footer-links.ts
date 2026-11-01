import { links } from "@/lib/links";

export type FooterColumn = {
  title: string;
  items: readonly { label: string; to: string }[];
};

export const footerColumns: readonly FooterColumn[] = [
  {
    title: "Product",
    items: [
      { label: "Investigation console", to: "/console" },
      { label: "Data quality", to: "/console?view=quality" },
      { label: "Query ledger", to: "/console?view=ledger" },
      { label: "Sources and freshness", to: "/console?view=sources" },
    ],
  },
  {
    title: "How it works",
    items: [
      { label: "From recall to proof", to: "#system" },
      { label: "Four sources, one query", to: "#sources" },
      { label: "Published recalls", to: "#recalls" },
    ],
  },
  {
    title: "Sources",
    items: [
      { label: "openFDA enforcement reports", to: links.openfdaEnforcement },
      { label: "openFDA drug shortages", to: links.openfdaShortages },
      { label: "openFDA terms", to: links.openfdaTerms },
      { label: "Zetaris getting started", to: links.zetarisStart },
    ],
  },
  {
    title: "Project",
    items: [
      { label: "Source code", to: links.repo },
      { label: "Safety boundary", to: "#about" },
    ],
  },
];
