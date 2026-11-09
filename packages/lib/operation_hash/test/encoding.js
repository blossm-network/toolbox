import { expect } from "chai";
import operationHash from "../index.js";

describe("Operation tuple identity", () => {
  it("separates component boundaries and optional positions with one encoding", () => {
    const values = [
      operationHash("ab", "c", "abcdefghijklmnopqr", "command"),
      operationHash("a", "bc", "abcdefghijklmnopqr", "command"),
      operationHash("a", undefined),
      operationHash("a", null),
      operationHash("a", ""),
      operationHash("a"),
    ];
    expect(values.slice(0, 2)).to.deep.equal(["1312403163", "3803274043"]);
    expect(new Set(values).size).to.equal(values.length);
    for (const value of values) expect(value).to.match(/^[0-9]+$/);
  });
});
