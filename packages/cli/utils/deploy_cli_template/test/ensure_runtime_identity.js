import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import yaml from "yaml";
import ensureRuntimeIdentity from "../ensure_runtime_identity.js";

const project = "blossm-dev";
const runtime = `start@${project}.iam.gserviceaccount.com`;
const buildIdentity = `build@${project}.iam.gserviceaccount.com`;

// Runs against a recording double: nothing here reaches gcloud.
const run = ({
  account = runtime,
  describe,
  withBuildIdentity = true,
  queues = false,
  refuseSelfGrant = false,
  policy,
} = {}) => {
  const workingDir = mkdtempSync(path.join(tmpdir(), "blossm-identity-"));
  writeFileSync(
    path.join(workingDir, "build.yaml"),
    yaml.stringify({
      steps: [
        { name: "node", args: ["yarn"] },
        {
          name: "gcloud",
          args: [
            "run",
            "deploy",
            ...(account ? [`--service-account=${account}`] : []),
          ],
        },
        ...(queues
          ? [
              {
                name: "gcloud",
                args: [
                  "tasks",
                  "queues",
                  "add-iam-policy-binding",
                  "q",
                  "--role=roles/cloudtasks.enqueuer",
                ],
              },
            ]
          : []),
      ],
      ...(withBuildIdentity && {
        serviceAccount: `projects/${project}/serviceAccounts/${buildIdentity}`,
      }),
    }),
  );
  const calls = [];
  try {
    ensureRuntimeIdentity({
      workingDir,
      project,
      execFileSync: (command, args) => {
        assert.equal(command, "gcloud");
        calls.push(args.join(" "));
        if (args[2] == "describe" && describe)
          throw Object.assign(new Error("failed"), { stderr: describe });
        if (args[2] == "get-iam-policy") return policy;
        if (
          refuseSelfGrant &&
          args.includes(`--member=serviceAccount:${runtime}`)
        )
          throw Object.assign(new Error("failed"), {
            stderr: "PERMISSION_DENIED",
          });
      },
    });
  } finally {
    rmSync(workingDir, { recursive: true, force: true });
  }
  return calls;
};
const describeCall = `iam service-accounts describe ${runtime} --project=${project}`;
const createCall = `iam service-accounts create start --quiet --project=${project}`;

describe("Runtime identity before a deployment", () => {
  it("leaves an existing identity untouched", () => {
    assert.deepEqual(run(), [describeCall]);
  });

  it("creates a missing identity and lets the build identity deploy as it", () => {
    assert.deepEqual(
      run({ describe: "ERROR: NOT_FOUND: Unknown service account" }),
      [
        describeCall,
        createCall,
        `iam service-accounts add-iam-policy-binding ${runtime} --member=serviceAccount:${buildIdentity} --role=roles/iam.serviceAccountUser --condition=None --quiet --project=${project}`,
      ],
    );
  });

  it("only creates it when the build uses the project's default identity", () => {
    assert.deepEqual(run({ describe: "NOT_FOUND", withBuildIdentity: false }), [
      describeCall,
      createCall,
    ]);
  });

  it("changes nothing when it cannot tell whether the identity exists", () => {
    assert.deepEqual(run({ describe: "PERMISSION_DENIED" }), [describeCall]);
  });

  it("does nothing for a dry run or another project's identity", () => {
    assert.deepEqual(run({ account: null }), []);
    assert.deepEqual(
      run({
        account: "x@other.iam.gserviceaccount.com",
        describe: "NOT_FOUND",
      }),
      [],
    );
  });
  const selfGrant = `iam service-accounts add-iam-policy-binding ${runtime} --member=serviceAccount:${runtime} --role=roles/iam.serviceAccountUser --condition=None --quiet --project=${project}`;

  const look = `iam service-accounts get-iam-policy ${runtime} --format=json --project=${project}`;
  const bindings = (...members) =>
    JSON.stringify({
      bindings: [{ role: "roles/iam.serviceAccountUser", members }],
    });

  it("grants nothing on a redeploy that already has it", () => {
    assert.deepEqual(
      run({
        queues: true,
        refuseSelfGrant: true,
        policy: bindings(`serviceAccount:${runtime}`),
      }),
      [describeCall, look],
    );
    // Someone else's leave to act as it is not its own.
    assert(
      run({
        queues: true,
        policy: bindings(`serviceAccount:${buildIdentity}`),
      }).includes(selfGrant),
    );
    // Nor is leave that holds only under a condition.
    assert(
      run({
        queues: true,
        policy: JSON.stringify({
          bindings: [
            {
              role: "roles/iam.serviceAccountUser",
              members: [`serviceAccount:${runtime}`],
              condition: { expression: "false" },
            },
          ],
        }),
      }).includes(selfGrant),
    );
  });

  it("lets a service that queues tasks act as itself, new or existing", () => {
    assert.deepEqual(run({ queues: true }), [describeCall, look, selfGrant]);
    assert.equal(
      run({ queues: true, describe: "NOT_FOUND" }).at(-1),
      selfGrant,
    );
    // A service that queues nothing gets no such grant.
    assert(!run().includes(selfGrant));
    assert(!run({ describe: "NOT_FOUND" }).includes(selfGrant));
  });

  it("stops the deployment when that grant can't be made", () => {
    assert.throws(
      () => run({ queues: true, refuseSelfGrant: true }),
      /queues tasks as itself.*PERMISSION_DENIED/,
    );
  });
});
