import assert from "assert";
import path from "path";
import fs from "fs";
import os from "os";
import { spawnSync } from "child_process";
import { load } from "./load.js";

const buildDir = "utils/merge_cli_template/src/write_build";

describe("Generated build steps", () => {
  it("checks DNS and domain mapping targets using native resource projections", async () => {
    const ensureResource = (options) => options;
    const dns = await load(`${buildDir}/steps/ensure_dns_record.js`, {
      ensureResource,
    });
    const mapping = await load(`${buildDir}/steps/map_domain.js`, {
      ensureResource,
    });
    const options = {
      uri: "c.bird.example.com",
      dnsZone: "zone",
      project: "target",
      serviceName: "gateway",
      region: "us-central1",
    };
    const record = dns(options);
    assert.deepStrictEqual(record.describe.slice(0, 4), [
      "dns",
      "record-sets",
      "describe",
      "c.bird.example.com.",
    ]);
    assert(record.describe.includes("--type=CNAME"));
    assert(record.describe.includes("--format=value(rrdatas)"));
    assert(record.create.includes("--rrdatas=ghs.googlehosted.com."));
    assert.strictEqual(record.expected, "ghs.googlehosted.com.");
    const domain = mapping(options);
    assert(domain.describe.includes("--format=value(spec.routeName)"));
    assert(domain.create.includes("--service=gateway"));
    assert(domain.describe.includes("--platform=managed"));
    assert(domain.create.includes("--platform=managed"));
    assert(!domain.create.some((arg) => arg.includes("force-override")));
    assert.strictEqual(domain.expected, "gateway");
    for (const args of [
      record.describe,
      record.create,
      domain.describe,
      domain.create,
    ])
      assert(args.includes("--project=target"));
  });

  it("generates verified DNS and mapping steps for all three gateways", async () => {
    for (const procedure of [
      "command_gateway",
      "fact_gateway",
      "view_gateway",
    ]) {
      const source = fs.readFileSync(
        new URL(
          `../../utils/merge_cli_template/src/write_build/${procedure}.js`,
          import.meta.url,
        ),
        "utf8",
      );
      const names = [...source.matchAll(/^import (\w+) from/gm)].map(
        (match) => match[1],
      );
      const generator = await load(
        `${buildDir}/${procedure}.js`,
        Object.fromEntries(
          names.map((name) => [
            name,
            name === "yarnInstall"
              ? {}
              : (options) => ({ step: name, options }),
          ]),
        ),
      );
      for (const strict of [false, true]) {
        const steps = generator({
          strict,
          domain: "bird",
          service: "animals",
          context: "dashboard",
          network: "example.com",
          envUriSpecifier: "staging.",
          dnsZone: "zone",
          project: "target",
          region: "us-central1",
          serviceName: "gateway",
        });
        const dns = steps.filter((step) => step.step === "ensureDnsRecord");
        const mapping = steps.filter((step) => step.step === "mapDomain");
        assert.strictEqual(dns.length, strict ? 1 : 0, procedure);
        assert.strictEqual(mapping.length, strict ? 1 : 0, procedure);
        assert(
          !steps.some((step) => /DnsTransaction/.test(step.step)),
          procedure,
        );
        if (strict) {
          assert.strictEqual(dns[0].options.uri, mapping[0].options.uri);
          assert.strictEqual(dns[0].options.project, "target");
          assert.strictEqual(mapping[0].options.serviceName, "gateway");
        }
      }
    }
  });

  it("rejects existing resources whose selected target differs", async () => {
    const ensureResource = await load(`${buildDir}/steps/ensure_resource.js`);
    const step = ensureResource({
      describe: ["resource", "describe"],
      create: ["resource", "create"],
      expected: "expected-target",
    });
    const fixture = fs.mkdtempSync(
      path.join(os.tmpdir(), "blossm-target-step-"),
    );
    try {
      fs.writeFileSync(
        path.join(fixture, "gcloud"),
        `#!/bin/bash
printf '%s\\n' "$*" >&2
if [ "$2" = describe ]; then printf '%s\\n' "$DESCRIBE_VALUE"; exit "$DESCRIBE_STATUS"; fi
exit "$WRITE_STATUS"
`,
        { mode: 0o755 },
      );
      for (const [value, readStatus, writeStatus, expectedStatus] of [
        ["expected-target", 0, 7, 0],
        ["wrong-target", 0, 0, 1],
        ["", 0, 0, 1],
        ["expected-target;other-target", 0, 0, 1],
        ["", 1, 0, 0],
        ["", 1, 7, 7],
      ]) {
        const result = spawnSync(
          "/bin/bash",
          step.args.map((arg) => arg.replace(/\$\$/g, "\u0024")),
          {
            cwd: fixture,
            encoding: "utf8",
            env: {
              PATH: fixture,
              DESCRIBE_VALUE: value,
              DESCRIBE_STATUS: String(readStatus),
              WRITE_STATUS: String(writeStatus),
            },
          },
        );
        assert.strictEqual(
          result.status,
          expectedStatus,
          `${value}: ${result.stderr}`,
        );
        if (readStatus === 0)
          assert(!result.stderr.includes("resource create"));
      }
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });
});

for (const [matches, writeStatus, status] of [
  [true, 0, 0],
  [true, 7, 7],
  [false, 0, 1],
]) {
  it(`keeps expected targets out of update argv (match=${matches}, write=${writeStatus})`, async function () {
    this.timeout(10000);
    const ensureResource = await load(`${buildDir}/steps/ensure_resource.js`);
    const expected = "literal $(touch marker) target";
    const actual = matches ? expected : "wrong";
    const step = ensureResource({
      describe: ["resource", "describe"],
      create: ["resource", "create"],
      update: ["resource", "update", "literal $(touch marker)"],
      expected,
    });
    const fixture = fs.mkdtempSync(
      path.join(os.tmpdir(), "blossm-target-update-"),
    );
    try {
      const calls = path.join(fixture, "calls.jsonl");
      fs.writeFileSync(
        path.join(fixture, "gcloud"),
        String.raw`#!${process.execPath}
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(process.env.CALLS, JSON.stringify(args) + "\n");
if(args[1] === "describe") { console.log(process.env.ACTUAL); process.exit(0); }
process.exit(Number(process.env.WRITE_STATUS));
`,
        { mode: 0o755 },
      );

      fs.writeFileSync(calls, "");
      const result = spawnSync(
        "/bin/bash",
        step.args.map((arg) => arg.replace(/\$\$/g, "\u0024")),
        {
          cwd: fixture,
          encoding: "utf8",
          env: {
            PATH: fixture,
            CALLS: calls,
            ACTUAL: actual,
            WRITE_STATUS: String(writeStatus),
          },
        },
      );
      assert.equal(result.status, status, result.stderr);
      const recorded = fs
        .readFileSync(calls, "utf8")
        .trim()
        .split("\n")
        .map(JSON.parse);
      assert.deepEqual(
        recorded,
        actual === expected
          ? [
              ["resource", "describe"],
              ["resource", "update", "literal $(touch marker)"],
            ]
          : [["resource", "describe"]],
      );
      assert(!fs.existsSync(path.join(fixture, "marker")));
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });
}
