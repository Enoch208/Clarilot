# Property-based tests for NDC
_Exported on 02/11/2026 at 18:55:32 GMT+1 from Cursor (3.27.22)_

---

**User**

Read AGENTS.md first and follow it.

Task: add property-based tests for the NDC normaliser and the lot classifier.

1. Add fast-check to packages/core as an exact-pinned dev dependency: pnpm --filter @clarilot/core add -D -E fast-check@<current latest version>.
2. Read packages/core/src/ndc.ts, packages/core/src/lot.ts, packages/core/src/lot-tokens.ts and the existing tests in packages/core/tests first, so you use the real function names and signatures.
3. Create packages/core/tests/properties.test.ts with these fast-check properties:
   - normalizeProductNdc is idempotent: normalising the canonical 5-4 key it returns gives the same key back.
   - any valid 4-4, 5-3 or 5-4 product NDC maps to a 10-digit 5-4 key, and the raw value comes back unchanged.
   - a dispensed lot that is a strict substring or superstring of a lot listed in code_info is never LOT_EXACT.
   - empty or missing code_info never yields ALL_LOTS_EXPLICIT.
4. Run pnpm test. If a property finds a counterexample, stop and show me the shrunk input before changing any source file.
5. Run the full gate from AGENTS.md. Do not commit or push. Finish with a VERIFIED / BLOCKED / UNVERIFIED report listing every file you changed.


---

**Cursor**

I'll follow AGENTS.md and start by reading the NDC and lot sources plus the existing core tests, then pin the current fast-check release before writing properties.

fast-check 4.10.2 is the current release. I'll pin that on `@clarilot/core`, then write the properties against the real function signatures.

The normaliser and classifier are in place, and fast-check 4.10.2 is pinned. Next I’ll add properties that follow those signatures, then run the tests before touching any source.

Property tests for the NDC normaliser and the lot classifier are in place. No counterexample turned up, so `ndc.ts`, `lot.ts`, and `lot-tokens.ts` were left unchanged. Nothing was committed or pushed.

`fast-check` 4.10.2 is an exact dev dependency of `@clarilot/core`. `packages/core/tests/properties.test.ts` checks four properties, 100 runs each:

- A successful `normalizeProductNdc` result is idempotent: normalising the canonical 5-4 `productKey` again returns that same key. Inputs cover 4-4, 5-3, and 5-4 product NDCs, package NDCs, and the same values with surrounding spaces.
- Every generated 4-4, 5-3, and 5-4 product NDC comes back with `raw` unchanged and a `\d{5}-\d{4}` key whose segments are the same numbers, zero-padded.
- A dispensed lot that is a strict contiguous substring or superstring of one lot listed in `code_info` is never `LOT_EXACT`. The listed token has to actually parse out of `code_info`, and both NDCs are the same valid product NDC so the classifier reaches the lot comparison.
- `code_info` that is null, empty, or only whitespace never yields `ALL_LOTS_EXPLICIT`, including when all-lots rules are present.

**VERIFIED**

- `pnpm exec vitest run packages/core/tests/properties.test.ts`: 4 passed.
- Full gate, exit 0: `pnpm typecheck`, `pnpm lint`, `npx eslint -c eslint.local.config.js .`, `pnpm format:check` (all matched files use Prettier), `pnpm test` (15 files, 125 tests passed), `pnpm build` (Vite client build completed).

Files changed:

- `packages/core/package.json`
- `pnpm-lock.yaml`
- `packages/core/tests/properties.test.ts`

