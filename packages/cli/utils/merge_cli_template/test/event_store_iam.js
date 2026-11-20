import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import yaml from "yaml";
import eventStore from "../src/write_build/event_store.js";
import writeBuild from "../src/write_build/index.js";

// The generated gcloud steps run for real, but against the `gcloud` double
// written below: PATH holds nothing else and Bash is named by absolute path.
// Nothing here can reach the real gcloud or any cloud API.
const store = {
  procedure: "event-store",
  service: "core",
  domain: "session",
  actions: ["start", "end"],
  region: "us-east1",
  project: "blossm-dev",
  serviceName: "us-east1-store-hash",
  computeUrlId: "url",
  uri: "us-east1-store-hash-url.us-east1.run.app",
  blockSchedule: "0 5 * * *",
  checkInSchedule: "0 6 * * *",
  checkInPath: "check-in",
  containerRegistery: "registry",
};
const postgres = {
  eventStoreKind: "postgres",
  postgres: {
    database: "blossm",
    user: "runtime",
    max: 2,
    cloudSqlInstance: "blossm-dev:us-east1:pg",
    passwordSecret: "pg-password:1",
  },
};
const custom = "blossm-session@blossm-dev.iam.gserviceaccount.com";
const compute = "123456-compute@developer.gserviceaccount.com";
const executer = "executer@blossm-dev.iam.gserviceaccount.com";

// Cloud Build replaces its built-in project number and then unescapes doubled
// dollars. Any other bare dollar would be substituted away, so reject it.
const substituted = (arg) => {
  const resolved = arg.replaceAll("${PROJECT_NUMBER}", "123456");
  assert(!resolved.replaceAll("$$", "").includes("$"), `bare dollar: ${arg}`);
  return resolved.replaceAll("$$", () => "$");
};
const gcloudSteps = (steps) =>
  steps.flat().filter((step) => step.name == "gcr.io/cloud-builders/gcloud");

const bindings = (member, { encrypts = true } = {}) => {
  const grant = (resource, account, role) =>
    `${resource} --member=serviceAccount:${account} --role=${role} --project=blossm-dev --quiet`;
  const key = (name) =>
    `kms keys add-iam-policy-binding ${name} --keyring=us-east1-store-hash-blockchain --location=global --condition=None`;
  return {
    before: [
      ...(encrypts
        ? [grant(key("private"), member, "roles/cloudkms.cryptoKeyEncrypter")]
        : []),
      grant(key("producer"), member, "roles/cloudkms.signer"),
      grant(key("producer"), member, "roles/cloudkms.publicKeyViewer"),
      grant(
        "pubsub topics add-iam-policy-binding start.session.core",
        member,
        "roles/pubsub.publisher",
      ),
      grant(
        "pubsub topics add-iam-policy-binding end.session.core",
        member,
        "roles/pubsub.publisher",
      ),
      grant(
        "tasks queues add-iam-policy-binding event-store-core-session-create-block --location=us-east1",
        member,
        "roles/cloudtasks.enqueuer",
      ),
      grant(
        `iam service-accounts add-iam-policy-binding ${executer} --condition=None`,
        member,
        "roles/iam.serviceAccountUser",
      ),
    ],
    after: grant(
      "run services add-iam-policy-binding us-east1-store-hash --region=us-east1 --platform=managed --condition=None",
      executer,
      "roles/run.invoker",
    ),
  };
};

describe("Event-store deployment IAM", function () {
  // Each case spawns real shells, which outrun Mocha's 2s default under load.
  this.timeout(10000);

  let root;
  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "blossm-store-iam-"));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  // Runs the gcloud steps the way Cloud Build does: in order, stopping at the
  // first nonzero exit. `exists` answers every describe, and a call containing
  // `fail` exits 1. Like GA gcloud, the double has `--condition` on KMS key,
  // service-account and Cloud Run bindings only: it exits 2 when those omit
  // `--condition=None` (the strictest reading: gcloud needs it once the policy
  // holds a conditional binding) and when a topic or queue binding
  // carries any condition (gcloud rejects the unknown flag).
  const build = (steps, { exists = false, fail } = {}) => {
    const bin = mkdtempSync(path.join(root, "bin-"));
    const calls = path.join(bin, "calls");
    writeFileSync(
      path.join(bin, "gcloud"),
      `#!/bin/sh
echo "$*" >> "${calls}"
case "$*" in
  ${fail ? `*"${fail}"*) exit 1 ;;` : ""}
  *" describe "*) exit ${exists ? 0 : 1} ;;
esac
case "$*" in
  "kms keys add-iam-policy-binding "*|"iam service-accounts add-iam-policy-binding "*|"run services add-iam-policy-binding "*)
    case " $* " in *" --condition=None "*) ;; *) exit 2 ;; esac ;;
  "pubsub topics add-iam-policy-binding "*|"tasks queues add-iam-policy-binding "*)
    case "$*" in *--condition*) exit 2 ;; esac ;;
  *add-iam-policy-binding*) exit 2 ;;
esac
exit 0
`,
      { mode: 0o755 },
    );
    let status = 0;
    for (const step of gcloudSteps(steps)) {
      assert(["bash", "gcloud", undefined].includes(step.entrypoint));
      const result = spawnSync(
        step.entrypoint == "bash" ? "/bin/bash" : path.join(bin, "gcloud"),
        step.args.map(substituted),
        { env: { PATH: bin }, encoding: "utf8" },
      );
      assert.equal(result.error, undefined);
      status = result.status;
      if (status !== 0) break;
    }
    return {
      status,
      calls: existsSync(calls)
        ? readFileSync(calls, "utf8").trim().split("\n")
        : [],
    };
  };

  const adapters = [
    ["PostgreSQL", postgres],
    ["Mongo", {}],
  ];
  const identities = [
    ["the default compute identity", undefined, compute],
    ["an explicit identity", { serviceAccount: custom }, custom],
  ];

  for (const [adapter, options] of adapters)
    for (const [identity, cloudRun, member] of identities)
      it(`grants ${adapter} resources to ${identity} in deploy order`, () => {
        const { status, calls } = build(
          eventStore({ ...store, ...options, cloudRun, strict: true }),
        );
        assert.equal(status, 0);
        const { before, after } = bindings(member);
        const iam = calls.filter((call) =>
          call.includes("add-iam-policy-binding"),
        );
        // Exactly these grants: no project-wide role, no other member.
        assert.deepEqual(iam, [...before, after]);
        assert(!calls.some((call) => call.includes("set-iam-policy")));
        assert(!calls.some((call) => call.startsWith("projects ")));

        const index = (text) => {
          const found = calls.findIndex((call) => call.includes(text));
          assert.notEqual(found, -1, text);
          return found;
        };
        const deploy = index("run deploy us-east1-store-hash");
        // The revision runs as the member that was granted.
        assert(calls[deploy].includes(` --service-account=${member} `));
        // Keys, topics and queues exist before they are granted, and every
        // runtime grant lands before the service starts.
        for (const created of [
          "kms keys create private",
          "kms keys create producer",
          "pubsub topics create start.session.core",
          "pubsub topics create end.session.core",
          "tasks queues create event-store-core-session-create-block",
        ])
          assert(index(created) < calls.indexOf(before[0]), created);
        for (const grant of before) assert(calls.indexOf(grant) < deploy);
        // The executer may invoke before Scheduler is pointed at the service.
        assert(deploy < calls.indexOf(after));
        assert(calls.indexOf(after) < index("scheduler jobs create"));
      });

  // blossm.yaml `isPublic` reaches the generator as parsed. The deployed
  // entrypoint encrypts unless `config.isPublic || false` is truthy, so any
  // truthy value is a public store and every other value a private one.
  for (const [adapter, options] of adapters)
    for (const isPublic of [true, "yes", 1])
      it(`gives a public ${adapter} store (${JSON.stringify(isPublic)}) signing access and no encryption key`, () => {
        const { status, calls } = build(
          eventStore({ ...store, ...options, isPublic, strict: true }),
        );
        assert.equal(status, 0);
        const { before, after } = bindings(compute, { encrypts: false });
        assert.deepEqual(
          calls.filter((call) => call.includes("add-iam-policy-binding")),
          [...before, after],
        );
        // Neither the grant nor the key it would be on.
        assert(!calls.some((call) => call.includes("cryptoKeyEncrypter")));
        assert(!calls.some((call) => / keys \S+ private /.test(call)));
        assert(calls.some((call) => call.includes("kms keys create producer")));
      });

  for (const [adapter, options] of adapters)
    for (const isPublic of [undefined, null, false, "", 0])
      it(`keeps a ${adapter} store with isPublic ${JSON.stringify(isPublic)} private`, () => {
        const { status, calls } = build(
          eventStore({ ...store, ...options, isPublic, strict: true }),
        );
        assert.equal(status, 0);
        const { before, after } = bindings(compute);
        assert.deepEqual(
          calls.filter((call) => call.includes("add-iam-policy-binding")),
          [...before, after],
        );
        assert(
          calls.indexOf(
            calls.find((call) => call.includes("kms keys create private")),
          ) < calls.indexOf(before[0]),
        );
      });

  for (const [adapter, options] of adapters)
    for (const isPublic of [false, true])
      it(`adds no IAM binding to a ${adapter} test-only build, isPublic ${isPublic}`, () => {
        const steps = gcloudSteps(
          eventStore({ ...store, ...options, isPublic, strict: false }),
        );
        assert(!JSON.stringify(steps).includes("iam"));
        assert(!JSON.stringify(steps).includes("PROJECT_NUMBER"));
        const { status, calls } = build(steps);
        assert.equal(status, 0);
        assert(!calls.some((call) => call.includes("iam")));
        // Mongo's local block creation calls KMS, so its test-only build
        // keeps the keys that store uses. The PostgreSQL fixture has none.
        const created = calls
          .filter((call) => call.includes(" create "))
          .map((call) => call.split(" ").slice(0, 4).join(" "));
        assert.deepEqual(
          created,
          adapter == "Mongo"
            ? [
                "kms keyrings create us-east1-store-hash-blockchain",
                ...(isPublic ? [] : ["kms keys create private"]),
                "kms keys create producer",
              ]
            : [],
        );
      });

  it("changes no other procedure's build and adds no grant to one", () => {
    const render = (procedure, isPublic) => {
      writeBuild({
        workingDir: root,
        procedure,
        strict: true,
        actions: [],
        events: [],
        name: "read",
        domain: "session",
        service: "core",
        context: "ctx",
        region: "us-east1",
        project: "p",
        operationName: "operation",
        operationHash: "hash",
        isPublic,
      });
      return readFileSync(path.join(root, "build.yaml"), "utf8");
    };
    for (const procedure of [
      "command",
      "command-gateway",
      "fact",
      "fact-gateway",
      "job",
      "projection",
      "view-composite",
      "view-gateway",
      "view-store",
    ]) {
      const rendered = render(procedure, true);
      assert.equal(rendered, render(procedure, undefined), procedure);
      assert(yaml.parse(rendered).steps.length, procedure);
      assert(!rendered.includes("kms"), procedure);
      // A projection's long-standing push-invoker grant is the only binding
      // any of them holds.
      const grants = yaml
        .parse(rendered)
        .steps.filter((step) => step.args.includes("add-iam-policy-binding"));
      assert.equal(grants.length, procedure == "projection" ? 1 : 0, procedure);
      for (const { args } of grants)
        assert(
          args.some((arg) => arg.includes("cloud-run-pubsub-invoker@")),
          procedure,
        );
    }
  });

  it("repeats the same additive grants on a redeploy", () => {
    const steps = eventStore({ ...store, ...postgres, strict: true });
    const first = build(steps);
    const again = build(steps, { exists: true });
    assert.equal(again.status, 0);
    const iam = ({ calls }) =>
      calls.filter((call) => call.includes("add-iam-policy-binding"));
    assert.deepEqual(iam(again), iam(first));
    assert.equal(iam(again).length, 8);
    // Existing keys, topics and queues are reused, not recreated.
    assert(
      !again.calls.some((call) => / (keys|topics|queues) create /.test(call)),
    );
    assert(again.calls.some((call) => call.includes("scheduler jobs update")));
  });

  it("names no condition only where the GA command accepts one", () => {
    const iam = gcloudSteps(eventStore({ ...store, ...postgres, strict: true }))
      .filter((step) => step.args.includes("add-iam-policy-binding"))
      .map((step) => step.args);
    assert.equal(iam.length, 8);
    for (const args of iam) {
      const condition = args.filter((arg) => arg.startsWith("--condition"));
      const supported = ["kms", "iam", "run"].includes(args[0]);
      assert(supported || ["pubsub", "tasks"].includes(args[0]), args[0]);
      assert.deepEqual(
        condition,
        supported ? ["--condition=None"] : [],
        args.join(" "),
      );
    }
  });

  it("is rejected by the gcloud double when the condition choice is wrong", () => {
    const steps = gcloudSteps(
      eventStore({ ...store, ...postgres, strict: true }),
    );
    const binding = (group) =>
      steps.find(
        (step) =>
          step.args[0] == group && step.args.includes("add-iam-policy-binding"),
      );
    for (const group of ["kms", "iam", "run"]) {
      const step = binding(group);
      const args = step.args.filter((arg) => arg != "--condition=None");
      assert.equal(build([step]).status, 0, group);
      assert.equal(build([{ ...step, args }]).status, 2, group);
    }
    for (const group of ["pubsub", "tasks"]) {
      const step = binding(group);
      const args = [...step.args, "--condition=None"];
      assert.equal(build([step]).status, 0, group);
      assert.equal(build([{ ...step, args }]).status, 2, group);
    }
  });

  it("stops before the service starts when a runtime grant fails", () => {
    const { status, calls } = build(
      eventStore({ ...store, ...postgres, strict: true }),
      { fail: "roles/pubsub.publisher" },
    );
    assert.equal(status, 1);
    assert(calls.at(-1).includes("roles/pubsub.publisher"));
    assert(!calls.some((call) => call.includes("run deploy")));
    assert(!calls.some((call) => call.includes("scheduler")));
  });

  it("schedules nothing when the invoker grant fails", () => {
    const { status, calls } = build(
      eventStore({ ...store, ...postgres, strict: true }),
      { fail: "roles/run.invoker" },
    );
    assert.equal(status, 1);
    assert(calls.some((call) => call.includes("run deploy")));
    assert(!calls.some((call) => call.includes("scheduler")));
  });
});
