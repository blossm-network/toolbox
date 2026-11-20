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
});
