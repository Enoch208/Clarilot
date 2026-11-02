import {
  array,
  assert,
  constant,
  constantFrom,
  integer,
  oneof,
  pre,
  property,
  record,
  string,
  tuple,
  type Arbitrary,
} from "fast-check";
import { describe, it } from "vitest";
import { classifyLotEvidence, isCleanLot, normalizeProductNdc, parseLotTokens } from "../src";

const digit = integer({ min: 0, max: 9 }).map((value) => String(value));
const letter = integer({ min: 65, max: 90 }).map((value) => String.fromCharCode(value));
const alnum = oneof(letter, digit);

function digits(length: number): Arbitrary<string> {
  return integer({ min: 0, max: 10 ** length - 1 }).map((value) =>
    value.toString().padStart(length, "0"),
  );
}

const productNdc = oneof(
  tuple(digits(4), digits(4)).map(([labeler, product]) => `${labeler}-${product}`),
  tuple(digits(5), digits(3)).map(([labeler, product]) => `${labeler}-${product}`),
  tuple(digits(5), digits(4)).map(([labeler, product]) => `${labeler}-${product}`),
);

const packageNdc = tuple(productNdc, oneof(digits(1), digits(2))).map(
  ([product, packageCode]) => `${product}-${packageCode}`,
);

const padding = string({ minLength: 0, maxLength: 3, unit: constant(" ") });

const normalisableNdc = oneof(
  productNdc,
  packageNdc,
  tuple(padding, oneof(productNdc, packageNdc), padding).map(
    ([lead, value, trail]) => `${lead}${value}${trail}`,
  ),
);

const cleanLot = tuple(
  alnum,
  string({ minLength: 0, maxLength: 12, unit: oneof(alnum, constant("-")) }),
  alnum,
  digit,
).map(([start, middle, end, forcedDigit]) => `${start}${middle}${end}${forcedDigit}`);

function strictSlice(listed: string): Arbitrary<string> {
  return integer({ min: 0, max: listed.length - 1 }).chain((start) => {
    const maxEnd = start === 0 ? listed.length - 1 : listed.length;
    return integer({ min: start + 1, max: maxEnd }).map((end) => listed.slice(start, end));
  });
}

function strictSuperstring(listed: string): Arbitrary<string> {
  const extra = string({ minLength: 1, maxLength: 4, unit: alnum });
  return oneof(
    extra.map((prefix) => `${prefix}${listed}`),
    extra.map((suffix) => `${listed}${suffix}`),
    tuple(extra, extra).map(([prefix, suffix]) => `${prefix}${listed}${suffix}`),
  );
}

const lotOverlap = cleanLot.chain((listed) =>
  oneof(strictSlice(listed), strictSuperstring(listed)).map((dispensed) => ({
    listed,
    dispensed,
  })),
);

const blankCodeInfo = oneof(
  constant(null),
  constant(""),
  string({ minLength: 1, maxLength: 6, unit: constantFrom(" ", "\t", "\n", "\r") }),
);

const allLotsRule = record({
  recallNumber: string({ maxLength: 24 }),
  phrase: string({ maxLength: 48 }),
  reviewedBy: string({ maxLength: 24 }),
});

const boundedText = string({ maxLength: 32 });

describe("normalizeProductNdc properties", () => {
  it("is idempotent on the canonical 5-4 key", () => {
    assert(
      property(normalisableNdc, (raw) => {
        const parsed = normalizeProductNdc(raw);
        if (!parsed.ok) {
          return false;
        }
        const again = normalizeProductNdc(parsed.productKey);
        return (
          again.ok &&
          again.productKey === parsed.productKey &&
          /^\d{5}-\d{4}$/.test(parsed.productKey)
        );
      }),
    );
  });

  it("maps every 4-4, 5-3 and 5-4 product NDC to a 10-digit 5-4 key and keeps raw", () => {
    assert(
      property(productNdc, (raw) => {
        const parsed = normalizeProductNdc(raw);
        if (!parsed.ok || parsed.kind !== "product") {
          return false;
        }
        const [labeler, product] = raw.split("-");
        const [keyLabeler, keyProduct] = parsed.productKey.split("-");
        if (
          labeler === undefined ||
          product === undefined ||
          keyLabeler === undefined ||
          keyProduct === undefined
        ) {
          return false;
        }
        return (
          parsed.raw === raw &&
          /^\d{5}-\d{4}$/.test(parsed.productKey) &&
          Number(labeler) === Number(keyLabeler) &&
          Number(product) === Number(keyProduct)
        );
      }),
    );
  });
});

describe("classifyLotEvidence properties", () => {
  it("never calls a strict substring or superstring of a listed lot an exact match", () => {
    assert(
      property(lotOverlap, ({ listed, dispensed }) => {
        const codeInfo = `Lot ${listed}`;
        pre(isCleanLot(listed));
        pre(parseLotTokens(codeInfo).tokens.includes(listed));
        pre(dispensed !== listed);
        pre(listed.includes(dispensed) || dispensed.includes(listed));
        const result = classifyLotEvidence({
          recallNumber: "D-0000-2026",
          codeInfo,
          recallNdcRaw: "12345-6789",
          dispenseNdcRaw: "12345-6789",
          dispenseLot: dispensed,
        });
        return result.level !== "LOT_EXACT";
      }),
    );
  });

  it("never treats empty or missing code_info as an explicit all-lots scope", () => {
    assert(
      property(
        blankCodeInfo,
        oneof(constant(null), boundedText),
        boundedText,
        boundedText,
        boundedText,
        array(allLotsRule, { maxLength: 4 }),
        (codeInfo, dispenseLot, recallNdcRaw, dispenseNdcRaw, recallNumber, allLotsRules) => {
          const result = classifyLotEvidence({
            recallNumber,
            codeInfo,
            recallNdcRaw,
            dispenseNdcRaw,
            dispenseLot,
            allLotsRules,
          });
          return result.level !== "ALL_LOTS_EXPLICIT";
        },
      ),
    );
  });
});
