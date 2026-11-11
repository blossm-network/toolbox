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
      path.join(os.tmpdir(), "blossm-build-step-"),
    );
    try {
      const callsPath = path.join(fixture, "calls.jsonl");
      fs.writeFileSync(
        path.join(fixture, "gcloud"),
        `#!${process.execPath}
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(process.env.CALLS_PATH, JSON.stringify(args) + "\\n");
process.exit(Number(args.includes("describe") ? process.env.DESCRIBE_STATUS : process.env.WRITE_STATUS));
`,
        { mode: 0o755 },
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
          ring: "fixture-ring",
          location: "global",
          rotation: "30d",
          next: "2026-12-01T00:00:00Z",
          action: "issued",
          domain: "challenge",
          service: "core",
          procedure: "projection",
          operationHash: "fixture-hash",
          storeAction: "issued",
          storeDomain: "challenge",
          storeService: "core",
          serviceName: "fixture-service",
          computeUrlId: "fixture-project",
          maxDispatchPerSecond: 10,
          maxConcurrentDispatches: 100,
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
          assert(
            !/(^|[^$])\$\{/.test(step.args[1]),
            "Cloud Build dollars must be escaped",
          );
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
            `${filename}: ${result.stderr}`,
          );
          const calls = fs
            .readFileSync(callsPath, "utf8")
            .trim()
            .split("\n")
            .map((line) => JSON.parse(line));
          assert(
            calls.every((args) =>
              args.every((arg) => !arg.includes("undefined")),
            ),
          );
          if (filename === "schedule_job" && calls.length === 2)
            assert(calls[1].includes("--schedule=0 * * * *"));
          if (
            !["create_pubsub_topic", "create_pubsub_subscription"].includes(
              filename,
            )
          )
            assert(calls[0].includes("literal $(touch marker)"));
          assert(calls[0].includes("describe"), filename);
          assert.strictEqual(
            calls.length,
            describeStatus === 0 && filename !== "schedule_job" ? 1 : 2,
            filename,
          );
          if (calls.length === 2)
            assert(
              calls[1].includes(describeStatus === 0 ? "update" : "create"),
              filename,
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
          "--oidc-token-audience=https://service-project.region.run.app",
        ),
      );
    }
  });

  it("generates one reconciliation step per Scheduler job", async () => {
    const { default: eventStore } =
      await import("../../utils/merge_cli_template/src/write_build/event_store.js");
    const options = {
      strict: true,
      actions: ["issued"],
      service: "core",
      domain: "challenge",
      region: "us-central1",
      project: "fixture",
      serviceName: "store",
      blockSchedule: "* * * * *",
    };
    const steps = eventStore(options);
    const job = "event-store-core-challenge-create-block";
    assert.equal(
      steps.filter((step) => JSON.stringify(step).includes(job)).length,
      1,
    );
    const local = eventStore({ ...options, strict: false });
    assert(!local.some((step) => JSON.stringify(step).includes(job)));
  });
});
