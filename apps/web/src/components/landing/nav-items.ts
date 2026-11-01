import { links } from "@/lib/links";

export type NavLinkItem = {
  label: string;
  detail: string;
  to: string;
};

export type NavGroup = {
  label: string;
  items: readonly NavLinkItem[];
};

export const navGroups: readonly NavGroup[] = [
  {
    label: "Product",
    items: [
      {
        label: "Investigation console",
        detail: "Queue, case evidence and the pharmacist workbench",
        to: "/console",
      },
      {
        label: "Data quality",
        detail: "Rows that need correction before anyone relies on them",
        to: "/console?view=quality",
      },
      {
        label: "Query ledger",
        detail: "Every executed query with its SQL, sources and timing",
        to: "/console?view=ledger",
      },
    ],
  },
  {
    label: "How it works",
    items: [
      { label: "Four sources, one query", detail: "Federation through Zetaris", to: "#system" },
      { label: "Lot evidence levels", detail: "Why unknown never means safe", to: "#difference" },
      { label: "Pharmacist review", detail: "Drafts a person approves", to: "#difference" },
    ],
  },
  {
    label: "Sources",
    items: [
      {
        label: "openFDA enforcement reports",
        detail: "Published drug recalls, updated weekly",
        to: links.openfdaEnforcement,
      },
      {
        label: "openFDA drug shortages",
        detail: "Shortage status, shown as context only",
        to: links.openfdaShortages,
      },
      { label: "Zetaris", detail: "The federated query engine", to: links.zetarisStart },
    ],
  },
  {
    label: "Project",
    items: [
      { label: "Source code", detail: "The repository on GitHub", to: links.repo },
      { label: "Safety boundary", detail: "What Clarilot will never do", to: "#about" },
    ],
  },
];
