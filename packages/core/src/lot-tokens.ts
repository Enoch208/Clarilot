const month = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";

const datePatterns = [
  new RegExp(`\\b${month}\\s+\\d{1,2},?\\s+\\d{4}\\b`, "gi"),
  new RegExp(`\\b${month}\\s+\\d{4}\\b`, "gi"),
  new RegExp(`\\b\\d{1,2}-?${month}-?\\d{2,4}\\b`, "gi"),
  new RegExp(`\\b\\d{4}\\/${month}`, "gi"),
  /\b\d{4}-\d{2}-\d{2}\b/g,
  /\b\d{4}\/\d{1,2}\b/g,
  /\b\d{1,2}[/-]\d{1,2}[/-]\s?\d{2,4}\b/g,
  /\b\d{1,2}\/\s?\d{2,6}\b/g,
];

const expiryLabel =
  /\b(?:exp(?:iry|iration|ires)?|use\s+by|best\s+by)\b\.?(?:\s*date\b)?\.?\s*[:.,]?/gi;

const anchor =
  /\b(?:lots?|batch(?:es)?)\b(?:\s*(?:#|(?:no|nos|numbers?)\b\.?|number\(s\)))?\s*[#:]*\s*/gi;

const fillerWords = new Set(["and", "or", "&"]);

const tokenShape = /^[A-Z0-9](?:[A-Z0-9-]{1,30}[A-Z0-9])$/;

export type ParsedLots = {
  tokens: string[];
  complex: boolean;
  anchored: boolean;
};

export function normalizeLotToken(value: string): string {
  return value.trim().toUpperCase();
}

export function isCleanLot(value: string): boolean {
  const token = normalizeLotToken(value);
  return tokenShape.test(token) && /\d/.test(token);
}

function stripNoise(chunk: string): string {
  let text = chunk.replace(/\[[^\]]*\]/g, " ").replace(/\([^)]*\)/g, " ");
  for (const pattern of datePatterns) {
    text = text.replace(pattern, " ");
  }
  return text
    .replace(expiryLabel, " ")
    .replace(/(^|[\s,;])[a-z]\)/gi, "$1 ")
    .replace(/(^|[\s,;])\d{1,2}\)/g, "$1 ");
}

function pieces(chunk: string): string[] {
  return stripNoise(chunk)
    .split(/[,;&]|\band\b/i)
    .map((piece) =>
      piece
        .trim()
        .replace(/^[#:.\s]+/, "")
        .replace(/[.:#\s]+$/, ""),
    )
    .filter((piece) => piece !== "" && !fillerWords.has(piece.toLowerCase()));
}

export function parseLotTokens(codeInfo: string): ParsedLots {
  const starts = [...codeInfo.matchAll(anchor)].map((match) => ({
    from: match.index + match[0].length,
    at: match.index,
  }));
  if (starts.length === 0) {
    return { tokens: [], complex: codeInfo.trim() !== "", anchored: false };
  }
  const tokens = new Set<string>();
  let complex = pieces(codeInfo.slice(0, starts[0]?.at ?? 0)).length > 0;
  starts.forEach((start, index) => {
    const end = starts[index + 1]?.at ?? codeInfo.length;
    for (const piece of pieces(codeInfo.slice(start.from, end))) {
      if (isCleanLot(piece)) {
        tokens.add(normalizeLotToken(piece));
      } else {
        complex = true;
      }
    }
  });
  return { tokens: [...tokens], complex, anchored: true };
}
