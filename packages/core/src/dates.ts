import type { SourceDate } from "./contract/states";

function validIso(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

export function parseFdaCompactDate(raw: string | null | undefined): SourceDate | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  const match = /^(\d{4})(\d{2})(\d{2})$/.exec(raw.trim());
  if (match === null) {
    return { raw, iso: null };
  }
  return { raw, iso: validIso(Number(match[1]), Number(match[2]), Number(match[3])) };
}

export function parseShortageDate(raw: string | null | undefined): SourceDate | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw.trim());
  if (match === null) {
    return { raw, iso: null };
  }
  return { raw, iso: validIso(Number(match[3]), Number(match[1]), Number(match[2])) };
}
