import assert from "assert";
import { load } from "./load.js";

const fixture = async (domain, operation) => {
  const deps = Object.fromEntries(
    [
      "init",
      "secret",
      "queue",
      "command",
      "projection",
      "eventStore",
      "viewStore",
      "commandGateway",
      "viewGateway",
      "factGateway",
      "roles",
      "job",
      "fact",
      "viewComposite",
    ].map((name) => [name, operation])
  );
  return load(
    "blossm/src/index.js",
    {
      ...deps,
      chalk: {red:{bold:(value)=>value}},
      normalize: async () => ({ domain, args: [], positionalArgs: [] }),
      fs: { readFileSync: () => "fixture config" },
      yaml: { parse: () => ({ procedure: "command" }) },
      path: { resolve: () => "/fixture/blossm.yaml" },
      process: { cwd: () => "/fixture" },
    },
    "export const cli = "
  );
};

describe("CLI asynchronous dispatch", () => {
  it("returns completion for direct commands and shortcuts", async () => {
    for (const domain of ["command", "secret", "queue", "deploy", "test"]) {
      let resolve;
      const pending = new Promise((done) => {
        resolve = done;
      });
      const cli = await fixture(domain, () => pending);
      const result = cli(["node", "blossm", domain]);
      let completed = false;
      result.then(() => {
        completed = true;
      });
      await Promise.resolve();
      assert.strictEqual(completed, false);
      resolve("complete");
      assert.strictEqual(await result, "complete");
    }
  });
  it("propagates asynchronous failure from direct commands and shortcuts", async () => {
    for (const domain of ["command", "deploy", "test"]) {
      const failure = new Error("operation failed");
      const cli = await fixture(domain, async () => {
        throw failure;
      });
      await assert.rejects(
        cli(["node", "blossm", domain]),
        (err) => err === failure
      );
    }
  });
});
