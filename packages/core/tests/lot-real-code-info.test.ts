import { describe, expect, it } from "vitest";
import { parseLotTokens } from "../src";

const realCodeInfo = {
  "D-0038-2027":
    "Lot, expiry: [100 Tablets] Lots 8634085, 8635085, 8636085, exp 07/2027; [500 Tablets] Lot 8633085, exp 07/2027",
  "D-0042-2027": "Lot 1028135, 1029555; Exp. Date 07/31/2027",
  "D-0039-2027": "Lot #: LB00047A, LB00048A, Exp. Date 03/2028",
  "D-0874-2026": "Batch# 6B093FI, Exp. 04/01/28; Batch# 6F511F1, Exp. 05/15/28",
  "D-0863-2026":
    "Lot# 3161, Exp 8/2026, Lot# 3245, Expiry: 3/2027; Lot# 3260, Expiry: 5/2027; Lot# 3298, Lot# 3299, and Lot# 3300, Expiry: 6/2027; Lot# 3301, Lot# 3302, Lot# 3305 and Lot# 3306, Expiry: 7/2027",
  "D-0856-2026": "Lot #3192, Exp Date 01/312027;  3293, 3336 Exp Date 06/30/2027",
  "D-0865-2026":
    "Lots: 25128L1C0, Exp. August 31, 2026; 25280L1C0, Exp. October 31, 2026; 26108L1C0, Exp. July 31, 2027",
  "D-0869-2026": "Lot #: J6B435, J6B444, J6B457, Exp Date: 30APR2027.",
  "D-0849-2026": "Lot: Y495523, Y495523A, Exp 31-Oct-2027",
  "D-0837-2026": "Lot 108491 with case sequence numbers 14841 through 20013.",
  "D-0768-2026": "Lot #: 2411550, Exp. 2026/NOV.",
  "D-0719-2026": "Lot #: 4B1V, 4B1VA, Exp. Date 2027/01; 4J1V, Exp. Date 2027/09",
} as const;

describe("parseLotTokens against real openFDA code_info (fetched 2026-11-01)", () => {
  it.each([
    ["D-0038-2027", ["8634085", "8635085", "8636085", "8633085"]],
    ["D-0042-2027", ["1028135", "1029555"]],
    ["D-0039-2027", ["LB00047A", "LB00048A"]],
    ["D-0874-2026", ["6B093FI", "6F511F1"]],
    [
      "D-0863-2026",
      ["3161", "3245", "3260", "3298", "3299", "3300", "3301", "3302", "3305", "3306"],
    ],
    ["D-0856-2026", ["3192", "3293", "3336"]],
    ["D-0865-2026", ["25128L1C0", "25280L1C0", "26108L1C0"]],
    ["D-0869-2026", ["J6B435", "J6B444", "J6B457"]],
    ["D-0849-2026", ["Y495523", "Y495523A"]],
    ["D-0768-2026", ["2411550"]],
    ["D-0719-2026", ["4B1V", "4B1VA", "4J1V"]],
  ] as const)("%s lists exactly its lot tokens and no dates", (recall, expected) => {
    const parsed = parseLotTokens(realCodeInfo[recall]);
    expect(parsed.tokens).toEqual(expected);
    expect(parsed.complex).toBe(false);
  });

  it("marks prose with sequence numbers as too complex to read and takes no tokens from it", () => {
    const parsed = parseLotTokens(realCodeInfo["D-0837-2026"]);
    expect(parsed.tokens).toEqual([]);
    expect(parsed.complex).toBe(true);
  });

  it("treats text with no lot anchor as complex rather than lot-free", () => {
    expect(parseLotTokens("UPC 312547171502")).toEqual({
      tokens: [],
      complex: true,
      anchored: false,
    });
  });
});
