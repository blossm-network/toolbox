import assert from "assert";
import path from "path";
import fs from "fs";
import os from "os";
import { spawnSync } from "child_process";
import { load } from "./load.js";

const buildDir = "utils/merge_cli_template/src/write_build";

describe("Generated build steps", () => {
  it("reuses existing resources and propagates failed creates and updates", async function () {
    this.timeout(10000);
    const ensureResource = await load(`${buildDir}/steps/ensure_resource.js`);
    const fixture = fs.mkdtempSync(
      path.join(os.tmpdir(), "blossm-build-step-")
    );
    try {
      const callsPath = path.join(fixture, "calls.jsonl");
      fs.writeFileSync(
        path.join(fixture, "gcloud"),
        `#!/bin/bash
printf '%s\\n' "$*" >> "$CALLS_PATH"
for arg in "$@"; do
  if [ "$arg" = describe ]; then exit "$DESCRIBE_STATUS"; fi
done
exit "$WRITE_STATUS"
`,
        { mode: 0o755 }
      );
      for (const filename of [
        "create_key_ring",
        "create_symmetric_encrypt_key",
        "create_asymmetric_sign_key",
        "create_queue",
        "create_pubsub_topic",
        "create_pubsub_subscription",
        "schedule_job",
      ]) {
        const generate = await load(`${buildDir}/steps/${filename}.js`, {
          ensureResource,
        });
        const step = generate({
          name: "literal $(touch marker)",
          project: "target",
          region: "us-central1",
          schedule: "0 * * * *",
          uri: "host/_check-in",
        });
        for (const [describeStatus, writeStatus, expectedStatus] of [
          [0, 0, 0],
          [1, 0, 0],
          [1, 7, 7],
          [1, 2, 2],
          [0, 7, filename === "schedule_job" ? 7 : 0],
        ]) {
          fs.writeFileSync(callsPath, "");
          assert(!/(^|[^$])\$\{/.test(step.args[1]), "Cloud Build dollars must be escaped");
          const args = step.args.map((arg) => arg.replace(/\$\$/g, "\u0024"));
          const result = spawnSync("/bin/bash", args, {
            encoding: "utf8",
            cwd: fixture,
            env: {
              PATH: fixture,
              CALLS_PATH: callsPath,
              DESCRIBE_STATUS: String(describeStatus),
              WRITE_STATUS: String(writeStatus),
            },
          });
          assert.strictEqual(
            result.status,
            expectedStatus,
            `${filename}: ${result.stderr}`
          );
          const calls = fs.readFileSync(callsPath, "utf8").trim().split("\n");
          assert(calls[0].includes("describe"), filename);
          assert.strictEqual(
            calls.length,
            describeStatus === 0 && filename !== "schedule_job" ? 1 : 2,
            filename
          );
          if (calls.length === 2)
            assert(
              calls[1].includes(describeStatus === 0 ? "update" : "create"),
              filename
            );
          assert(!fs.existsSync(path.join(fixture, "marker")));
        }
      }
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });

  it("reconciles existing scheduler targets with structured arguments", async () => {
    const ensureResource = (options) => options;
    const schedule = await load(`${buildDir}/steps/schedule_job.js`, {
      ensureResource,
    });
    const options = schedule({
      name: "check-in",
      schedule: "0 * * * *",
      uri: "host/_check-in",
      project: "target",
      region: "region",
      serviceName: "service",
      computeUrlId: "project",
    });
    for (const args of [options.create, options.update]) {
      assert(args.includes("--uri=https://host/_check-in"));
      assert(args.includes("--schedule=0 * * * *"));
      assert(args.includes("--location=region"));
      assert(
        args.includes(
          "--oidc-token-audience=https://service-project.region.run.app"
        )
      );
    }
    const update = await load(`${buildDir}/steps/update_scheduled_job.js`);
    const step = update({
      name: "blocks",
      schedule: "0 * * * *",
      project: "target",
      region: "region",
    });
    assert.strictEqual(step.entrypoint, "gcloud");
    assert(step.args.includes("--location=region"));
    assert(!step.args.some((arg) => arg.includes("exit 0")));
  });


});
