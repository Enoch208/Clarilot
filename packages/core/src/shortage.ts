import type { ShortageEvidence } from "./contract/states";

export function shortageEvidenceFor(sourceStatus: string | null | undefined): ShortageEvidence {
  if (sourceStatus === null || sourceStatus === undefined || sourceStatus.trim() === "") {
    return "NOT_VERIFIED_IN_SUBSET";
  }
  return sourceStatus.trim() === "Current" ? "LISTED_CURRENT" : "LISTED_OTHER_STATUS";
}
