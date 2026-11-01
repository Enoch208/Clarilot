import { describe, expect, it } from "vitest";
import { formatAge, formatSourceDate } from "../src/lib/format";
import { recallLookupUrl } from "../src/lib/links";

describe("recallLookupUrl", () => {
  it("builds an openFDA search for the exact recall number", () => {
    const url = new URL(recallLookupUrl(" D-0123-2026 "));
    expect(url.origin).toBe("https://api.fda.gov");
    expect(url.pathname).toBe("/drug/enforcement.json");
    expect(url.searchParams.get("search")).toBe('recall_number:"D-0123-2026"');
  });
});

describe("formatSourceDate", () => {
  it("formats a parsed source date in UTC", () => {
    expect(formatSourceDate({ raw: "20261028", iso: "2026-10-28" })).toBe("28 Oct 2026");
  });

  it("shows the raw source value when the date could not be parsed", () => {
    expect(formatSourceDate({ raw: "Q4 2026", iso: null })).toBe("Q4 2026");
  });
});

describe("formatAge", () => {
  const now = Date.parse("2026-11-01T12:00:00Z");

  it("reports seconds, minutes, hours and days", () => {
    expect(formatAge("2026-11-01T11:59:30Z", now)).toBe("30s ago");
    expect(formatAge("2026-11-01T11:15:00Z", now)).toBe("45 min ago");
    expect(formatAge("2026-11-01T06:00:00Z", now)).toBe("6 h ago");
    expect(formatAge("2026-10-25T12:00:00Z", now)).toBe("7 days ago");
  });

  it("never reports a negative age for a timestamp in the future", () => {
    expect(formatAge("2026-11-01T12:05:00Z", now)).toBe("0s ago");
  });
});
