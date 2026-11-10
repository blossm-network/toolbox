import assert from "node:assert/strict";
import composeUpdate from "../../../lib/compose_update/index.js";
import { load } from "./load.js";

describe("Generated projection positional selection", () => {
  it("keeps selectors for composition even when the update supplies their fields", async () => {
    let submitted;
    const adapter = await load("blossm/src/projection/deploy/src/index.js", {
      projection: (options) => options,
      process: { env: { NODE_ENV: "local" } },
      composeUpdate,
      handlers: {
        core: {
          example: () => ({
            id: "view",
            query: { "parents.id": "selected", "parents.children.id": "child" },
            update: {
              parents: [
                { id: "selected", children: [{ id: "child" }] },
                { id: "other", children: [{ id: "child" }] },
              ],
              "parents.children.$.name": "updated",
            },
          }),
        },
      },
      config: { name: "example" },
      gcpSecret: {},
      gcpToken: () => {},
      gcpQueue: { enqueue() {} },
      viewStore: () => ({
        set: () => ({
          update: (options) => {
            submitted = options;
          },
        }),
      }),
    });
    await adapter.mainFn({
      aggregate: {
        headers: { service: "core", domain: "example", root: "root" },
      },
      push: false,
    });
    assert.deepEqual(submitted.update.parents, [
      { id: "selected", children: [{ id: "child", name: "updated" }] },
      { id: "other", children: [{ id: "child" }] },
    ]);
  });
});
