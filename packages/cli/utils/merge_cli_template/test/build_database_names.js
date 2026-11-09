import assert from "node:assert/strict";
import eventStore from "../src/write_build/event_store.js";
import viewStore from "../src/write_build/view_store.js";

// These builders return Cloud Build descriptions; no command is executed.
describe("Deployed store database identities", () => {
  for (const [builder, config, expected] of [
    [
      eventStore,
      {
        procedure: "event-store",
        service: "core",
        domain: "ledger",
        actions: [],
      },
      "core_ledger",
    ],
    [
      viewStore,
      { procedure: "view-store", context: "team", name: "summary" },
      "team_summary",
    ],
    [viewStore, { procedure: "view-store", name: "summary" }, "summary"],
  ]) {
    it(`keeps ${expected} as the deployed database`, () => {
      const steps = builder({ ...config, strict: true });
      const deploy = steps.find((step) => step.args?.includes("deploy"));
      const env = deploy.args.find((arg) => arg.startsWith("--set-env-vars="));
      assert.match(env, new RegExp(`(?:=|,)MONGODB_DATABASE=${expected},`));
    });
  }
});
