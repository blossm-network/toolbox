import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import yaml from "yaml";
import { cliDir } from "./load.js";

// Runs the real deploy command and generator against a temporary workspace.
// The child's PATH holds only a recording `gcloud` double, so no cloud command
// can run; the double copies the assembled service before the CLI removes it.
export const scriptDir = path.join(cliDir, "blossm/src/event_store/deploy");
const deployUrl = pathToFileURL(
  path.join(cliDir, "utils/deploy_cli_template/index.js"),
).href;

export const profile = (overrides = {}) => ({
  network: "blossm.network",
  blockSchedule: "0 5 * * *",
  environmentPrefixes: {
    development: "development.",
    staging: "staging.",
    production: "",
  },
  defaultEnv: "development",
  defaults: { eventStore: "postgres", cloud: "gcp" },
  vendors: {
    cloud: {
      gcp: {
        projects: { development: "blossm-network-development" },
        computeUrlIds: { development: "abc123" },
        secretsBuckets: { development: "secrets" },
        rolesBuckets: { development: "roles" },
        registries: {
          development:
            "us-east1-docker.pkg.dev/blossm-network-development/blossm",
        },
        buildServiceAccounts: {
          development:
            "blossm-build@blossm-network-development.iam.gserviceaccount.com",
        },
        runtimeServiceAccounts: {
          development:
            "blossm-session@blossm-network-development.iam.gserviceaccount.com",
        },
        vpcConnectors: { development: null },
        ingress: { development: "all" },
        maxInstances: { development: 1 },
        minInstances: { development: 0 },
        defaults: { region: "us-east1", timeout: "120s", memory: "512Mi" },
      },
    },
    eventStore: {
      postgres: {
        connections: {
          development: {
            database: "blossm",
            user: "blossm_runtime",
            max: 2,
            cloudSqlInstance: "blossm-network-development:us-east1:blossm-pg",
            passwordSecret: { name: "blossm-postgres-password", version: "1" },
          },
        },
      },
    },
  },
  ...overrides,
});

export const handlersSource =
  "export default { start: (state, payload) => ({ ...state, ...payload }) };\n";
export const procedure = {
  procedure: "event-store",
  domain: "session",
  service: "core",
  actions: ["start"],
  schema: { device: "String" },
  indexes: ["device"],
  testing: {
    handlers: [{ action: "start", examples: [{ payload: { device: "a" } }] }],
    examples: [
      { action: "start", payload: { device: "a" } },
      { action: "start", payload: { device: "b" } },
    ],
  },
};

export const node = (script, args, options) =>
  spawnSync(
    process.execPath,
    ["--input-type=module", "-e", script, ...args],
    { encoding: "utf8", ...options },
  );

// `overrides` are merged into the store's blossm.yaml.
export const deploy = (root, config, args = [], overrides = {}) => {
  const workspace = fs.mkdtempSync(path.join(root, "workspace-"));
  const source = path.join(workspace, "core/session/event_store");
  const bin = path.join(workspace, "bin");
  const capture = path.join(workspace, "capture");
  const calls = path.join(workspace, "gcloud-calls");
  fs.mkdirSync(source, { recursive: true });
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(workspace, "config.yaml"), yaml.stringify(config));
  fs.writeFileSync(
    path.join(source, "blossm.yaml"),
    yaml.stringify({ ...procedure, ...overrides }),
  );
  fs.writeFileSync(path.join(source, "handlers.js"), handlersSource);
  fs.writeFileSync(
    path.join(bin, "gcloud"),
    `#!/bin/sh\necho "$@" >> "${calls}"\n/bin/cp -R . "${capture}"\n`,
    { mode: 0o755 },
  );
  const result = node(
    `const [deploy, dir, ...args] = process.argv.slice(1);
     await (await import(deploy)).default({ domain: "event-store", dir })(
       args,
       () => ({ operationName: "store", operationHash: "hash" }),
     );`,
    [deployUrl, scriptDir, "--env", "development", ...args],
    { cwd: source, env: { PATH: bin, TMPDIR: workspace } },
  );
  const read = (file) => fs.readFileSync(path.join(capture, file), "utf8");
  return {
    result,
    capture,
    read,
    calls: fs.existsSync(calls)
      ? fs.readFileSync(calls, "utf8").trim().split("\n")
      : [],
    remaining: fs
      .readdirSync(workspace)
      .filter((entry) => entry.startsWith("blossm-")),
  };
};

export const deployment = (build) => {
  const index = build.steps.findIndex((step) => step.args?.includes("deploy"));
  return {
    args: build.steps[index]?.args,
    variables:
      index > 0 &&
      JSON.parse(
        Buffer.from(build.steps[index - 1].args.at(-1), "base64").toString(),
      ),
  };
};
