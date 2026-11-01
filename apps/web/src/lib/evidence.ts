import type { IconSvgElement } from "@hugeicons/react";
import {
  Alert02Icon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  HelpCircleIcon,
  InformationCircleIcon,
  WifiDisconnected01Icon,
} from "@hugeicons/core-free-icons";
import type { HealthStatus, LotEvidenceLevel, ShortageEvidence } from "@clarilot/core";

export type Tone = "critical" | "caution" | "calm" | "mute" | "ok";

export const toneClasses: Record<Tone, string> = {
  critical: "bg-critical-soft text-critical",
  caution: "bg-caution-soft text-caution",
  calm: "bg-calm-soft text-calm",
  mute: "bg-mist text-mute",
  ok: "bg-accent-soft text-accent",
};

export const toneDots: Record<Tone, string> = {
  critical: "bg-critical",
  caution: "bg-amber",
  calm: "bg-calm",
  mute: "bg-mute",
  ok: "bg-accent",
};

export type BadgeSpec = { label: string; tone: Tone; icon: IconSvgElement };

export const lotBadges: Record<LotEvidenceLevel, BadgeSpec> = {
  LOT_EXACT: { label: "Lot matches notice", tone: "critical", icon: Alert02Icon },
  ALL_LOTS_EXPLICIT: { label: "All lots in scope", tone: "critical", icon: Alert02Icon },
  PRODUCT_MATCH_LOT_UNKNOWN: {
    label: "Lot unknown: review",
    tone: "caution",
    icon: HelpCircleIcon,
  },
  LOT_DIFFERENT_UNVERIFIED: {
    label: "Different lot, unverified",
    tone: "calm",
    icon: InformationCircleIcon,
  },
  IDENTIFIER_UNVERIFIED: { label: "Identifier unverified", tone: "caution", icon: AlertCircleIcon },
  SOURCE_UNAVAILABLE: { label: "Source unavailable", tone: "mute", icon: WifiDisconnected01Icon },
};

export const lotSeverity: Record<LotEvidenceLevel, number> = {
  LOT_EXACT: 0,
  ALL_LOTS_EXPLICIT: 1,
  PRODUCT_MATCH_LOT_UNKNOWN: 2,
  IDENTIFIER_UNVERIFIED: 3,
  LOT_DIFFERENT_UNVERIFIED: 4,
  SOURCE_UNAVAILABLE: 5,
};

export const shortageBadges: Record<ShortageEvidence, BadgeSpec> = {
  LISTED_CURRENT: { label: "Listed in shortage: Current", tone: "caution", icon: AlertCircleIcon },
  LISTED_OTHER_STATUS: {
    label: "Listed in shortage data",
    tone: "calm",
    icon: InformationCircleIcon,
  },
  NOT_VERIFIED_IN_SUBSET: { label: "Not verified in subset", tone: "mute", icon: HelpCircleIcon },
};

export const healthBadges: Record<HealthStatus, BadgeSpec> = {
  OK: { label: "Healthy", tone: "ok", icon: CheckmarkCircle02Icon },
  DEGRADED: { label: "Degraded", tone: "caution", icon: AlertCircleIcon },
  UNAVAILABLE: { label: "Unavailable", tone: "critical", icon: WifiDisconnected01Icon },
  NOT_CONFIGURED: { label: "Not configured", tone: "mute", icon: HelpCircleIcon },
};

export function classificationBadge(classification: string): BadgeSpec {
  const normal = classification.trim().toUpperCase();
  if (normal === "CLASS I") return { label: "Class I", tone: "critical", icon: Alert02Icon };
  if (normal === "CLASS II") return { label: "Class II", tone: "caution", icon: AlertCircleIcon };
  if (normal === "CLASS III")
    return { label: "Class III", tone: "calm", icon: InformationCircleIcon };
  return { label: classification, tone: "mute", icon: HelpCircleIcon };
}

export function classRank(classification: string): number {
  const normal = classification.trim().toUpperCase();
  if (normal === "CLASS I") return 0;
  if (normal === "CLASS II") return 1;
  if (normal === "CLASS III") return 2;
  return 3;
}
