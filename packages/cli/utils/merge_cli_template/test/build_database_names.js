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
      const steps = builder({ ...config, strict: true }).flat();
      const deploy = steps.find((step) => step.args?.includes("deploy"));
      const envFile = deploy.args.find((arg) =>
        arg.startsWith("--env-vars-file=")
      );
      if (envFile) {
        // Inspect the artifact selected by the composed deployment writer.
        const filename = envFile.slice("--env-vars-file=".length);
        const writer = steps.find(
          (step) =>
            step.entrypoint === "node" &&
            step.args?.[1]?.includes(JSON.stringify(filename))
        );
        assert.ok(writer, "the deployment environment file must have a writer");
        const env = JSON.parse(
          Buffer.from(writer.args[2], "base64").toString("utf8")
        );
        assert.equal(env.MONGODB_DATABASE, expected);
      } else {
        const env = deploy.args.find((arg) =>
          arg.startsWith("--set-env-vars=")
        );
        assert.match(env, new RegExp(`(?:=|,)MONGODB_DATABASE=${expected},`));
      }
    });
  }
});
