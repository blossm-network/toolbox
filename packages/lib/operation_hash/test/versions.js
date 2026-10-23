import { strict as assert } from "node:assert";
import operationHash, { environment } from "../index.js";

const previous = process.env.OPERATION_IDENTITY_VERSION;
const reset = () => previous == undefined
  ? delete process.env.OPERATION_IDENTITY_VERSION
  : process.env.OPERATION_IDENTITY_VERSION = previous;

describe("Operation identity versions", () => {
  afterEach(reset);
  it("retains every legacy name when unset or explicitly selected", () => {
    delete process.env.OPERATION_IDENTITY_VERSION;
    const old = operationHash("ab", "c", "abcdefghijklmnopqr", "command");
    assert.equal(old, "1815271505");
    assert.equal(old, operationHash("a", "bc", "abcdefghijklmnopqr", "command"));
    process.env.OPERATION_IDENTITY_VERSION = "1";
    assert.equal(operationHash("ab", "c", "abcdefghijklmnopqr", "command"), old);
    assert.deepEqual(environment(), { OPERATION_IDENTITY_VERSION: "1" });
  });
  it("distinguishes boundaries, undefined, null, empty and missing values in version 2", () => {
    process.env.OPERATION_IDENTITY_VERSION = "2";
    const values = [
      operationHash("ab", "c", "abcdefghijklmnopqr", "command"),
      operationHash("a", "bc", "abcdefghijklmnopqr", "command"),
      operationHash("a", undefined), operationHash("a", null), operationHash("a", ""), operationHash("a"),
    ];
    assert.equal(values[0], "v2-1312403163");
    assert.equal(values[1], "v2-3803274043");
    assert.equal(new Set(values).size, values.length);
    values.forEach(value => assert.match(value, /^v2-[0-9]+$/));
    assert.deepEqual(environment(), { OPERATION_IDENTITY_VERSION: "2" });
  });
  it("rejects unknown configuration instead of routing to legacy endpoints", () => {
    process.env.OPERATION_IDENTITY_VERSION = "3";
    assert.throws(() => environment(), /Unsupported operation identity version/);
    assert.throws(() => operationHash("a"), /Unsupported operation identity version/);
  });
});
