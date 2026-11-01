export const links = {
  repo: "https://github.com/Enoch208/Clarilot",
  openfdaEnforcement: "https://open.fda.gov/apis/drug/enforcement/",
  openfdaShortages: "https://open.fda.gov/apis/drug/drugshortages/",
  openfdaTerms: "https://open.fda.gov/terms/",
  zetarisStart: "https://github.com/zetaris/getting-started",
} as const;

export function recallLookupUrl(recallNumber: string): string {
  const query = new URLSearchParams({ search: `recall_number:"${recallNumber.trim()}"` });
  return `https://api.fda.gov/drug/enforcement.json?${query.toString()}`;
}
