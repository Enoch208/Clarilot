import type { IconSvgElement } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  FileValidationIcon,
  FlowConnectionIcon,
  SecurityCheckIcon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";

export type SystemStep = {
  title: string;
  body: string;
  icon: IconSvgElement;
};

export const systemSteps: readonly SystemStep[] = [
  {
    title: "Ingest",
    body: "Clarilot reads published openFDA enforcement reports and keeps each recall number, report date and lot text exactly as written, with the time it was fetched.",
    icon: FileValidationIcon,
  },
  {
    title: "Federate",
    body: "One Zetaris SQL statement joins the pharmacy’s dispensing database, its receiving ledger and both FDA feeds where they live. No warehouse, no nightly sync.",
    icon: FlowConnectionIcon,
  },
  {
    title: "Classify",
    body: "Product NDCs are normalised to one key with the raw value kept. Lot evidence is classified conservatively: a missing or unclear lot means review, never safe.",
    icon: CheckmarkCircle02Icon,
  },
  {
    title: "Review",
    body: "Each match opens as an investigation with its evidence and its gaps. A pharmacist approves or rejects a draft. The software never contacts a patient.",
    icon: UserCheck01Icon,
  },
  {
    title: "Prove",
    body: "Every query is logged with its ID, exact SQL, sources, timing and row count, so any flag on screen can be reproduced from the ledger.",
    icon: SecurityCheckIcon,
  },
];
