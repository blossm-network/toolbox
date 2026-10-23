import assert from "assert";
import { load } from "./load.js";

describe("Generated procedure RPC helpers", () => {
  it("returns composite read responses and propagates their failures", async () => {
    const response = { body: { content: [{ id: "one" }] } };
    for (const fail of [false, true]) {
      const error = new Error("read failed");
      const procedure = await load(
        "blossm/src/view_composite/deploy/src/index.js",
        {
          viewComposite: (options) => options,
          main: () => {},
          process: { env: {} },
          gcpToken: () => {},
          viewStore: () => ({
            set: () => ({
              read: async () => {
                if (fail) throw error;
                return response;
              },
            }),
          }),
        }
      );
      const result = procedure.viewsFn({})({ name: "list" });
      if (fail) await assert.rejects(result, (err) => err === error);
      else assert.strictEqual(await result, response);
    }
  });
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
      if (count === null)
        await assert.rejects(result, (err) => err === failure);
      else assert.strictEqual(await result, count);
    }
  });
});
