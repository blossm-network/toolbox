import assert from "assert";
import { load } from "./load.js";

describe("Generated procedure RPC helpers", () => {
  it("awaits command count results, including zero, and propagates failure", async () => {
    for (const count of [0, 12, null]) {
      const failure = new Error("count failed");
      const procedure = await load("blossm/src/command/deploy/src/index.js", {
        commandProcedure: (options) => options,
        main: () => {},
        config: {},
        validate: undefined,
        normalize: undefined,
        fill: undefined,
        gcpToken: () => {},
        process: { env: {} },
        eventStore: () => ({
          set: () => ({
            count: async () => {
              if (count === null) throw failure;
              return { body: { count } };
            },
          }),
        }),
      });
      const result = procedure.countFn({})({ domain: "bird", root: "root" });
      if (count === null) await assert.rejects(result, (err) => err === failure);
      else assert.strictEqual(await result, count);
    }
  });
});
