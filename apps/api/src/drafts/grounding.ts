import type { Alert, DraftContent, Grounding, GroundingCheck } from "@clarilot/core";
import { lotLabelFor, sourceIdsFor } from "./template";

const prohibited = [
  "you are safe",
  "is safe",
  "not affected",
  "no risk",
  "definitely exposed",
  "were exposed",
  "harm",
  "stop taking",
  "keep taking",
  "switch to",
  "substitut",
  "replace your",
  "replacement",
  "dose",
  "dosage",
  "increase",
  "decrease",
  "discontinue",
  "we have contacted",
  "has been sent",
  "was sent",
];

const maxDraftLength = 600;

function allowedFacts(alert: Alert, queryId: string): string[] {
  return [
    alert.dispense.drugLabel,
    alert.caseKey,
    alert.recall.recallNumber,
    alert.recall.classification,
    alert.recall.reportDate.raw,
    alert.lot.reason,
    lotLabelFor(alert),
    queryId,
    String(alert.dispense.dispenseId),
  ]
    .filter((fact) => fact !== "")
    .sort((a, b) => b.length - a.length);
}

function strip(text: string, facts: readonly string[]): string {
  return facts.reduce((rest, fact) => rest.split(fact).join(" "), text);
}

export function groundDraft(content: DraftContent, alert: Alert, queryId: string): Grounding {
  const facts = allowedFacts(alert, queryId);
  const combined = `${content.draftText}\n${content.pharmacistNote}`;
  const residue = strip(combined, facts).toLowerCase();
  const numbers = residue.match(/\d[\d/.:-]*/g) ?? [];
  const phrases = prohibited.filter((phrase) => new RegExp(`\\b${phrase}`, "i").test(residue));
  const expectedSources = new Set(sourceIdsFor(alert, queryId));
  const checks: GroundingCheck[] = [
    {
      check: "recall_number_matches_source",
      ok: content.recallNumber === alert.recall.recallNumber,
      detail: `draft ${content.recallNumber}, source ${alert.recall.recallNumber}`,
    },
    {
      check: "drug_label_matches_source",
      ok: content.drugLabel === alert.dispense.drugLabel,
      detail: `draft "${content.drugLabel}", source "${alert.dispense.drugLabel}"`,
    },
    {
      check: "lot_label_matches_classifier",
      ok: content.lotLabel === lotLabelFor(alert),
      detail: `draft "${content.lotLabel}", classifier "${lotLabelFor(alert)}"`,
    },
    {
      check: "draft_cites_recall_number",
      ok: content.draftText.includes(alert.recall.recallNumber),
      detail: "the patient draft must quote the verified recall number",
    },
    {
      check: "draft_directs_to_pharmacist_or_prescriber",
      ok: /pharmacist or prescriber/i.test(content.draftText),
      detail: "the patient draft must ask the recipient to contact a pharmacist or prescriber",
    },
    {
      check: "no_unapproved_numbers",
      ok: numbers.length === 0,
      detail:
        numbers.length === 0
          ? "every number traces to the source row"
          : `unapproved: ${numbers.join(", ")}`,
    },
    {
      check: "no_medical_instruction_or_outcome_claim",
      ok: phrases.length === 0,
      detail: phrases.length === 0 ? "no prohibited phrasing" : `prohibited: ${phrases.join(", ")}`,
    },
    {
      check: "source_ids_known",
      ok:
        content.sourceIds.length > 0 &&
        content.sourceIds.every((id) => expectedSources.has(id)) &&
        content.sourceIds.includes(alert.recall.recallNumber),
      detail: `allowed: ${[...expectedSources].join(", ")}`,
    },
    {
      check: "draft_length",
      ok: content.draftText.length <= maxDraftLength,
      detail: `${String(content.draftText.length)} of ${String(maxDraftLength)} characters`,
    },
  ];
  return { ok: checks.every((c) => c.ok), checks };
}
