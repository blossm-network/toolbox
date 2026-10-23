import assert from "assert";
import * as chai from "chai";
import { load } from "./load.js";

const checkResponse = () =>
  load("utils/merge_cli_template/template/base_test/assert_response.js", {
    chai,
  });

describe("Shared generated response assertion owner", () => {
  it("rejects incorrect falsy values and nested object-array values", async () => {
    const check = await checkResponse();
    for (const [actual, expected] of [
      [true, false],
      [1, 0],
      ["wrong", ""],
    ]) {
      assert.throws(
        () => check({ data: { value: actual }, expected: { value: expected } }),
        chai.AssertionError
      );
      check({ data: { value: expected }, expected: { value: expected } });
    }
    assert.throws(
      () =>
        check({
          data: { rows: [{ id: "wrong" }] },
          expected: { rows: [{ id: "expected" }] },
        }),
      chai.AssertionError
    );
    check({
      data: { rows: [{ id: "expected", extra: true }] },
      expected: { rows: [{ id: "expected" }] },
    });
  });
  it("preserves recursive expected-subset and placeholder behavior", async () => {
    const check = await checkResponse();
    check({
      data: { nested: { id: "one", extra: true }, token: "opaque" },
      expected: { nested: { id: "one" }, token: null },
    });
    assert.throws(
      () => check({ data: {}, expected: { missing: null } }),
      chai.AssertionError
    );
    assert.throws(
      () =>
        check({
          data: { nested: { id: "wrong" } },
          expected: { nested: { id: "one" } },
        }),
      chai.AssertionError
    );
  });
});
