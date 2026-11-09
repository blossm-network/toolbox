import assert from "assert";
import * as chai from "chai";
import { load } from "./load.js";

const checkResponse = () =>
  load("utils/merge_cli_template/template/base_test/assert_response.js", {
    chai,
  });

describe("Shared generated response assertion owner", () => {
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
