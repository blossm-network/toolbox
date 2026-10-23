import assert from "node:assert/strict";
import { claimTimestamp } from "../index.js";

describe("JWT time conversion", () => {
  it("converts legacy and NumericDate values to the same milliseconds", () => {
    assert.equal(claimTimestamp("2023-11-14T22:13:20.125Z"), 1700000000125);
    assert.equal(claimTimestamp(1700000000.125), 1700000000125);
  });
  it("respects an explicit validation format instead of guessing", () => {
    assert.throws(() => claimTimestamp(1700000000, { format: "legacy" }), {
      message: "The token time claim is invalid.",
    });
    assert.throws(
      () => claimTimestamp("2023-11-14T22:13:20.000Z", { format: "jose" }),
      { message: "The token time claim is invalid." }
    );
  });
  for (const value of [undefined, null, "invalid", NaN, Infinity]) {
    it(`rejects nonfinite or missing time ${value}`, () => {
      assert.throws(() => claimTimestamp(value), {
        message: "The token time claim is invalid.",
      });
    });
  }
});
