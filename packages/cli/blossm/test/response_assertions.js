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
        chai.AssertionError,
      );
      check({ data: { value: expected }, expected: { value: expected } });
    }
    assert.throws(
      () =>
        check({
          data: { rows: [{ id: "wrong" }] },
          expected: { rows: [{ id: "expected" }] },
        }),
      chai.AssertionError,
    );
    check({
      data: { rows: [{ id: "expected", extra: true }] },
      expected: { rows: [{ id: "expected" }] },
    });
  });

  it("rejects wrong or missing scalar and nested array elements", async () => {
    const check = await checkResponse();
    for (const [actual, expected] of [
      [[999], [1]],
      [[], [1]],
      [[true], [false]],
      [[1], [0]],
      [["wrong"], [""]],
      [[[999]], [[1]]],
      [[[]], [[1]]],
      [[null], [1]],
      [[], [null]],
    ]) {
      assert.throws(
        () => check({ data: { rows: actual }, expected: { rows: expected } }),
        chai.AssertionError,
      );
    }
    for (const values of [[1, 0, false, ""], [[1], [false]], [{ id: "one" }]]) {
      check({ data: { rows: values }, expected: { rows: values } });
    }
    check({ data: { rows: ["opaque", "extra"] }, expected: { rows: [null] } });
  });
});
