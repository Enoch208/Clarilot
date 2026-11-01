import type { IconSvgElement } from "@hugeicons/react";
import {
  ChartLineData01Icon,
  Csv01Icon,
  Database01Icon,
  FileValidationIcon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons";
import type { ImageName } from "@/lib/images";

export type SourceCard = {
  title: string;
  body: string;
  icon: IconSvgElement;
  tone: string;
  image: ImageName;
};

export const sourceCards: readonly SourceCard[] = [
  {
    title: "Recall notice",
    body: "Published openFDA enforcement records: recall number, classification, product NDCs and lot text as written.",
    icon: FileValidationIcon,
    tone: "bg-amber text-ink",
    image: "source-recall",
  },
  {
    title: "Dispensing records",
    body: "The synthetic pharmacy’s PostgreSQL database: which product, lot and date each record carries. Queried in place.",
    icon: Database01Icon,
    tone: "bg-accent text-white",
    image: "source-dispensing",
  },
  {
    title: "Receiving ledger",
    body: "A CSV of lots received per store. It supports provenance; a missing receipt never clears a dispense.",
    icon: Csv01Icon,
    tone: "bg-periwinkle text-ink",
    image: "source-receiving",
  },
  {
    title: "Shortage status",
    body: "openFDA drug shortages, shown as availability context only. Never a substitution recommendation.",
    icon: ChartLineData01Icon,
    tone: "bg-sky text-ink",
    image: "source-shortage",
  },
  {
    title: "Query ledger",
    body: "Every execution logged with its query ID, SQL digest, sources, timing and row count.",
    icon: SecurityCheckIcon,
    tone: "bg-taupe text-white",
    image: "source-ledger",
  },
];
