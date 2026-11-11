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
      chai.AssertionError,
    );
    assert.throws(
      () =>
        check({
          data: { nested: { id: "wrong" } },
          expected: { nested: { id: "one" } },
        }),
      chai.AssertionError,
    );
  });
});

// These are the two directory layers copied by merge-cli-template. Import the
// emitted helper with Node as well as checking each generated suite's reference.
for (const procedure of ["command", "fact", "view_composite"]) {
  it(`includes the shared response assertion in generated ${procedure} tests`, async () => {
    const { cp, mkdtemp, readFile, rm } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { pathToFileURL } = await import("node:url");
    const { cliDir } = await import("./load.js");
    const fixture = await mkdtemp(join(cliDir, ".response-assert-"));
    try {
      await cp(
        join(cliDir, "utils/merge_cli_template/template/base_test"),
        join(fixture, "base_test"),
        { recursive: true },
      );
      await cp(
        join(cliDir, `blossm/src/${procedure}/deploy/src/base_test`),
        join(fixture, "base_test"),
        { recursive: true },
      );
      const entrypoint = await readFile(
        join(fixture, "base_test/integration/index.js"),
        "utf8",
      );
      assert.match(entrypoint, /import \w+ from "\.\.\/assert_response\.js"/);
      const { default: check } = await import(
        pathToFileURL(join(fixture, "base_test/assert_response.js"))
      );
      check({ data: { value: "fixture" }, expected: { value: "fixture" } });
      assert.throws(
        () =>
          check({ data: { value: "wrong" }, expected: { value: "fixture" } }),
        chai.AssertionError,
      );
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  });
}
