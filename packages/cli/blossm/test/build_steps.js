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
          import.meta.url
        ),
        "utf8"
      );
      const names = [...source.matchAll(/^import (\w+) from/gm)].map(
        (match) => match[1]
      );
      const generator = await load(
        `${buildDir}/${procedure}.js`,
        Object.fromEntries(
          names.map((name) => [
            name,
            name === "yarnInstall"
              ? {}
              : (options) => ({ step: name, options }),
          ])
        )
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
          procedure
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
      path.join(os.tmpdir(), "blossm-target-step-")
    );
    try {
      fs.writeFileSync(
        path.join(fixture, "gcloud"),
        `#!/bin/bash
printf '%s\\n' "$*" >&2
if [ "$2" = describe ]; then printf '%s\\n' "$DESCRIBE_VALUE"; exit "$DESCRIBE_STATUS"; fi
exit "$WRITE_STATUS"
`,
        { mode: 0o755 }
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
          }
        );
        assert.strictEqual(
          result.status,
          expectedStatus,
          `${value}: ${result.stderr}`
        );
        if (readStatus === 0)
          assert(!result.stderr.includes("resource create"));
      }
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });

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
          assert(
            !/(^|[^$])\$\{/.test(step.args[1]),
            "Cloud Build dollars must be escaped"
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

  it("installs production dependencies from the build lock and excludes workspace artifacts", () => {
    const template = new URL(
      "../../utils/merge_cli_template/template/",
      import.meta.url
    );
    const dockerfile = fs.readFileSync(new URL("Dockerfile", template), "utf8");
    const ignored = fs
      .readFileSync(new URL(".dockerignore", template), "utf8")
      .trim()
      .split("\n");
    assert(dockerfile.includes("COPY package.json yarn.lock ./"));
    assert(
      dockerfile.includes("RUN yarn install --production --frozen-lockfile")
    );
    assert(!dockerfile.includes("npm install"));
    for (const entry of [
      "node_modules",
      ".git",
      ".env",
      ".env.*",
      "test",
      "base_test",
      "build.yaml",
      "docker-compose.yaml",
      ".aws",
      ".gcloud",
    ]) {
      assert(ignored.includes(entry), entry);
    }
  });

  it("keeps job and fact development overrides out of the deployed environment", async () => {
    for (const procedure of ["job", "fact"]) {
      const source = fs.readFileSync(
        new URL(
          `../../utils/merge_cli_template/src/write_build/${procedure}.js`,
          import.meta.url
        ),
        "utf8"
      );
      const names = [...source.matchAll(/^import (\w+) from/gm)].map(
        (match) => match[1]
      );
      const generator = await load(
        `${buildDir}/${procedure}.js`,
        Object.fromEntries(
          names.map((name) => [
            name,
            name === "yarnInstall"
              ? {}
              : (options) => ({ step: name, options }),
          ])
        )
      );
      const steps = generator({
        strict: true,
        env: "production",
        envVars: { ENDPOINT: "production", LIVE: "yes" },
        devEnvVars: { ENDPOINT: "development", TEST_ONLY: "yes" },
      });
      const deployed = steps.find((step) => step.step === "deployRun").options
        .env;
      assert.strictEqual(deployed.ENDPOINT, "production", procedure);
      assert.strictEqual(deployed.LIVE, "yes", procedure);
      assert(!Object.hasOwn(deployed, "TEST_ONLY"), procedure);
      const local = steps.find((step) => step.step === "writeEnv").options
        .custom;
      assert.strictEqual(local.ENDPOINT, "development", procedure);
      assert.strictEqual(local.TEST_ONLY, "yes", procedure);
    }
  });

  it("creates event-store KMS resources only for a strict deployment", async () => {
    const source = fs.readFileSync(
      new URL(
        `../../utils/merge_cli_template/src/write_build/event_store.js`,
        import.meta.url
      ),
      "utf8"
    );
    const names = [...source.matchAll(/^import (\w+) from/gm)].map(
      (match) => match[1]
    );
    const generator = await load(
      `${buildDir}/event_store.js`,
      Object.fromEntries(
        names.map((name) => [
          name,
          name === "yarnInstall" ? {} : () => ({ resource: name }),
        ])
      )
    );
    const resources = [
      "createKeyRing",
      "createSymmetricEncryptKey",
      "createAsymmetricSignKey",
    ];
    for (const strict of [false, true]) {
      const steps = generator({ strict, actions: [] });
      for (const resource of resources) {
        assert.strictEqual(
          steps.filter((step) => step.resource === resource).length,
          strict ? 1 : 0,
          resource
        );
      }
    }
  });

  it("updates queues in the selected project with exactly the configured limit", async () => {
    const updateQueue = await load(`${buildDir}/steps/update_queue.js`);
    for (const limit of [1, 100]) {
      const step = updateQueue({
        name: "queue",
        project: "target-project",
        maxDispatchPerSecond: limit,
        maxConcurrentDispatches: limit,
      });
      assert.strictEqual(step.entrypoint, "gcloud");
      assert.deepStrictEqual(step.args.slice(0, 4), [
        "tasks",
        "queues",
        "update",
        "queue",
      ]);
      assert.deepStrictEqual(
        step.args.filter((arg) =>
          arg.startsWith("--max-concurrent-dispatches=")
        ),
        [`--max-concurrent-dispatches=${limit}`]
      );
      assert(step.args.includes("--project=target-project"));
      assert(!step.args.some((arg) => arg.includes("exit 0")));
    }
  });

  it("forwards the deployment project to every queue update", async () => {
    for (const procedure of [
      "command",
      "event_store",
      "job",
      "projection",
      "view_store",
    ]) {
      const source = await import("fs").then(({ default: fs }) =>
        fs.readFileSync(
          new URL(
            `../../utils/merge_cli_template/src/write_build/${procedure}.js`,
            import.meta.url
          ),
          "utf8"
        )
      );
      const names = [...source.matchAll(/^import (\w+) from/gm)].map(
        (match) => match[1]
      );
      const queueOptions = [];
      const generator = await load(
        `${buildDir}/${procedure}.js`,
        Object.fromEntries(
          names.map((name) => [
            name,
            name === "yarnInstall"
              ? {}
              : (options) => {
                  if (name === "updateQueue") queueOptions.push(options);
                  return {};
                },
          ])
        )
      );
      generator({
        strict: true,
        project: "target-project",
        actions: [],
        events: [],
      });
      assert(queueOptions.length, procedure);
      for (const options of queueOptions)
        assert.strictEqual(options.project, "target-project", procedure);
    }
  });

  it("writes environment data without shell or build-variable interpolation", async () => {
    const runtimeUrl = new URL(
      "../../utils/merge_cli_template/runtime.js",
      import.meta.url
    );
    // The runtime owner lands in a separate PR. Use its actual image selection
    // whenever present instead of substituting a fake version in the fixture.
    const runtime = fs.existsSync(runtimeUrl) ? await import(runtimeUrl) : {};
    const writeEnv = await load(`${buildDir}/steps/write_env.js`, runtime);
    const literal =
      '$VAR $(touch marker) `touch marker` "quotes"\nEOM\nOTHER=value';
    const step = writeEnv({ custom: { LITERAL: literal } });
    if (runtime.nodeImage) assert.strictEqual(step.name, runtime.nodeImage);
    assert.strictEqual(step.entrypoint, "node");
    assert.strictEqual(step.args[0], "-e");
    assert(!step.args[2].includes("$"));
    let filename;
    let bytes;
    const run = new Function("require", "process", "Buffer", step.args[1]);
    run(
      (name) => {
        assert.strictEqual(name, "fs");
        return {
          writeFileSync: (file, data) => {
            filename = file;
            bytes = data;
          },
        };
      },
      { argv: ["node", step.args[2]] },
      Buffer
    );
    assert.strictEqual(filename, ".env");
    assert(bytes.toString().endsWith(`LITERAL=${literal}\n`));
  });

  it("passes one complete scheduler host to every procedure", async () => {
    const procedures = {
      "view-store": "viewStore",
      "view-composite": "viewComposite",
      "event-store": "eventStore",
      projection: "projection",
      command: "command",
      job: "job",
      fact: "fact",
    };
    let build;
    const writeBuild = await load(`${buildDir}/index.js`, {
      path,
      fs: {
        existsSync: () => false,
        writeFileSync: (file, value) => {
          build = value;
        },
      },
      yaml: { stringify: (value) => value },
      ...Object.fromEntries(
        Object.values(procedures).map((name) => [name, (options) => [options]])
      ),
    });
    for (const procedure of Object.keys(procedures)) {
      writeBuild({
        workingDir: "/fixture",
        procedure,
        region: "us-central1",
        operationName: "operation",
        operationHash: "hash",
        computeUrlId: "project",
      });
      assert.strictEqual(
        build.steps[0].uri,
        "us-central1-operation-hash-project.us-central1.run.app"
      );
      assert(!/\s/.test(build.steps[0].uri));
    }
  });
});
