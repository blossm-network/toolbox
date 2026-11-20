import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import yaml from "yaml";
import { load } from "./load.js";
import {
  scriptDir,
  profile,
  handlersSource,
  procedure,
  node,
  deploy,
  deployment,
} from "./postgres_deploy_fixture.js";
import environmentPrefix from "../../utils/cli_root_dir/environment_prefix.js";

const mongoProfile = () => {
  const config = profile({ defaults: { eventStore: "mongodb" } });
  delete config.environmentPrefixes;
  for (const key of [
    "registries",
    "buildServiceAccounts",
    "runtimeServiceAccounts",
    "vpcConnectors",
    "ingress",
    "maxInstances",
    "minInstances",
  ])
    delete config.vendors.cloud.gcp[key];
  config.vendors.eventStore = {
    mongodb: {
      users: { development: "blossm" },
      hosts: { development: "mongo.example.test" },
      protocol: "mongodb+srv",
    },
  };
  return config;
};

// The status expectations the generated integration suite will load.
const expectations = async (capture) =>
  (await import(pathToFileURL(path.join(capture, "base_test/expectations.js"))))
    .default;

describe("PostgreSQL event-store deployment", function () {
  this.timeout(30000);
  let root;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "blossm-pg-deploy-"));
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it("assembles and submits a PostgreSQL service from blossm.yaml and handlers.js", async () => {
    const { result, read, calls, capture, remaining } = deploy(root, profile());
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(calls, [
      ". --config=build.yaml --project=blossm-network-development",
    ].map((rest) => `beta builds submit ${rest}`));
    assert.deepEqual(remaining, []);

    const manifest = JSON.parse(read("package.json"));
    assert.equal(manifest.dependencies["@blossm/postgres-event-store"], "*");
    for (const name of Object.keys({
      ...manifest.dependencies,
      ...manifest.devDependencies,
    }))
      assert(!name.includes("mongo"), name);
    assert.match(read("index.js"), /from "@blossm\/postgres-event-store"/);
    assert.doesNotMatch(read("index.js"), /mongodb/);
    assert.equal(read("handlers.js"), handlersSource);
    assert.deepEqual(JSON.parse(read("config.json")).schema, procedure.schema);

    // The shared base suites still ship with the service.
    for (const file of [
      "base_test/unit/handlers.js",
      "base_test/integration/index.js",
    ])
      assert.equal(
        read(file),
        fs.readFileSync(path.join(scriptDir, "src", file), "utf8"),
      );
    assert.doesNotMatch(read("base_test/topic.js"), /gcp-pubsub/);
    // PostgreSQL rejects an invalid payload before it reaches the database.
    assert.equal((await expectations(capture)).invalidPayloadStatus, 400);
    assert.match(
      read("base_test/integration/index.js"),
      /statusCode\)\.to\.equal\(expectations\.invalidPayloadStatus\)/,
    );

    const build = yaml.parse(read("build.yaml"));
    assert.equal(
      build.serviceAccount,
      "projects/blossm-network-development/serviceAccounts/blossm-build@blossm-network-development.iam.gserviceaccount.com",
    );
    assert.equal(build.options.logging, "CLOUD_LOGGING_ONLY");
    const { args, variables } = deployment(build);
    // The complete command: no flag beyond the profile and no public access.
    assert.deepEqual(args, [
      "run",
      "deploy",
      "us-east1-store-hash",
      "--image=us-east1-docker.pkg.dev/blossm-network-development/blossm/event-store.core.session",
      "--platform=managed",
      "--memory=512Mi",
      "--timeout=120s",
      "--clear-vpc-connector",
      "--no-allow-unauthenticated",
      "--ingress=all",
      "--service-account=blossm-session@blossm-network-development.iam.gserviceaccount.com",
      "--max-instances=1",
      "--min-instances=0",
      "--add-cloudsql-instances=blossm-network-development:us-east1:blossm-pg",
      "--set-secrets=PG_PASSWORD=blossm-postgres-password:1",
      "--project=blossm-network-development",
      "--region=us-east1",
      "--env-vars-file=.blossm-cloud-run-env.json",
      "--labels=procedure=event-store,hash=hash,domain=session,service=core,",
    ]);
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(variables).filter(([key]) => key.startsWith("PG_")),
      ),
      {
        PG_HOST: "/cloudsql/blossm-network-development:us-east1:blossm-pg",
        PG_DATABASE: "blossm",
        PG_USER: "blossm_runtime",
        PG_MAX: "2",
        PG_NAMESPACE: "core_session",
      },
    );
    // The image is built, pushed and deployed from the configured registry.
    assert(!read("build.yaml").includes("gcr.io/blossm-network-development"));
    assert.equal(variables.NETWORK, "development.blossm.network");
    assert.equal(variables.HOST, "us-east1.development.blossm.network");
    assert(!read("build.yaml").includes("us-central1"));

    const compose = yaml.parse(read("docker-compose.yaml"));
    assert.deepEqual(Object.keys(compose.services).sort(), ["main", "postgres"]);
    assert.equal(
      compose.services.main.image,
      "us-east1-docker.pkg.dev/blossm-network-development/blossm/event-store.core.session:latest",
    );
    assert(!fs.existsSync(path.join(capture, "node_modules")));
  });

  it("omits the environment of unconfigured buckets", () => {
    const config = profile();
    config.vendors.cloud.gcp.secretsBuckets = {};
    config.vendors.cloud.gcp.rolesBuckets = {};
    const { result, read } = deploy(root, config);
    assert.equal(result.status, 0, result.stderr);
    const build = yaml.parse(read("build.yaml"));
    const { variables } = deployment(build);
    assert(!Object.hasOwn(variables, "GCP_SECRET_BUCKET"));
    assert(!Object.hasOwn(variables, "GCP_ROLES_BUCKET"));
    assert(!Object.values(variables).includes("undefined"));
    assert.equal(variables.GCP_PROJECT, "blossm-network-development");
    // The local .env is written by the first base64 step.
    const local = build.steps.find(
      (step) => step.entrypoint == "node" && /"\.env"/.test(step.args[1]),
    );
    assert.doesNotMatch(
      Buffer.from(local.args.at(-1), "base64").toString(),
      /BUCKET=|=undefined/,
    );
  });

  it("keeps a test-only build away from cloud resources and the deployment profile", () => {
    const config = profile();
    // Local fixtures ignore the cloud connection entirely.
    delete config.vendors.eventStore;
    const { result, read, calls } = deploy(root, config, ["--dry-run"]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(calls.length, 1);
    const build = yaml.parse(read("build.yaml"));
    assert.equal(deployment(build).args, undefined);
    assert.deepEqual(
      build.steps.filter((step) => step.name.includes("cloud-builders/gcloud")),
      [],
    );
    assert.equal(
      yaml.parse(read("docker-compose.yaml")).services.main.environment
        .PG_PASSWORD,
      "local-fixture-only",
    );
  });

  for (const [name, mutate, message] of [
    [
      "an unpinned password secret",
      (config) =>
        (config.vendors.eventStore.postgres.connections.development.passwordSecret.version =
          "latest"),
      /passwordSecret\.version/,
    ],
    [
      "a missing connection",
      (config) => delete config.vendors.eventStore.postgres.connections.development,
      /connections\.development/,
    ],
    [
      "an unknown event store",
      (config) => (config.defaults.eventStore = "sqlite"),
      /defaults\.eventStore/,
    ],
    [
      "an invalid runtime identity",
      (config) =>
        (config.vendors.cloud.gcp.runtimeServiceAccounts.development = "allUsers"),
      /runtimeServiceAccounts\.development/,
    ],
    [
      "an invalid build identity",
      (config) =>
        (config.vendors.cloud.gcp.buildServiceAccounts.development =
          "someone@example.com"),
      /buildServiceAccounts\.development/,
    ],
    [
      "an invalid registry",
      (config) =>
        (config.vendors.cloud.gcp.registries.development = "bad registry"),
      /registries\.development/,
    ],
    [
      "an invalid Cloud SQL instance",
      (config) =>
        (config.vendors.eventStore.postgres.connections.development.cloudSqlInstance =
          "blossm-pg"),
      /cloudSqlInstance/,
    ],
    [
      "an invalid environment prefix",
      (config) => (config.environmentPrefixes.development = "development"),
      /environmentPrefixes\.development/,
    ],
  ]) {
    it(`rejects ${name} before any gcloud command`, () => {
      const config = profile();
      mutate(config);
      const { result, calls, remaining } = deploy(root, config);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, message);
      assert.deepEqual(calls, []);
      assert.deepEqual(remaining, []);
    });
  }

  it("leaves a Mongo workspace on its existing entrypoint and deployment", async () => {
    const { result, read, capture } = deploy(root, mongoProfile());
    assert.equal(result.status, 0, result.stderr);
    const manifest = JSON.parse(read("package.json"));
    assert.deepEqual(
      manifest.dependencies,
      JSON.parse(
        fs.readFileSync(path.join(scriptDir, "src/base_config.json"), "utf8"),
      ).dependencies,
    );
    assert.equal(
      read("index.js"),
      fs.readFileSync(path.join(scriptDir, "src/index.js"), "utf8"),
    );
    assert.match(read("base_test/topic.js"), /gcp-pubsub/);
    assert.equal((await expectations(capture)).invalidPayloadStatus, 500);
    assert(!fs.existsSync(path.join(capture, "local.js")));
    const build = yaml.parse(read("build.yaml"));
    assert.deepEqual(Object.keys(build), ["steps"]);
    const { args, variables } = deployment(build);
    for (const expected of [
      "--image=us.gcr.io/blossm-network-development/event-store.core.session",
      "--vpc-connector=us-east1-network",
      "--vpc-egress=all",
      "--ingress=internal",
    ])
      assert(args.includes(expected), expected);
    assert(!args.includes("--clear-vpc-connector"));
    assert.equal(variables.NETWORK, "dev.blossm.network");
    assert.equal(variables.MONGODB_DATABASE, "core_session");
    assert.equal(variables.MONGODB_HOST, "mongo.example.test");
    assert(!Object.keys(variables).some((key) => key.startsWith("PG_")));
    const compose = yaml.parse(read("docker-compose.yaml"));
    assert.deepEqual(Object.keys(compose.services).sort(), ["db", "main"]);
  });

  it("starts the generated entrypoint locally without loading a cloud client", () => {
    const { result, read, capture } = deploy(root, profile());
    assert.equal(result.status, 0, result.stderr);
    const loaded = path.join(capture, "loaded");
    const module = (name, source) => {
      const directory = path.join(capture, "node_modules", name);
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(
        path.join(directory, "package.json"),
        JSON.stringify({ name, type: "module", main: "index.js" }),
      );
      fs.writeFileSync(path.join(directory, "index.js"), source);
    };
    module(
      "@blossm/postgres-event-store",
      "export default async (options) => { globalThis.store = options; return 'listening'; };",
    );
    module(
      "@blossm/event-store-rpc",
      "export default (identity) => ({ createBlock: async () => identity });",
    );
    for (const name of ["pubsub", "kms", "token", "queue", "secret"])
      module(
        `@blossm/gcp-${name}`,
        `import fs from "fs"; fs.appendFileSync(${JSON.stringify(loaded)}, "${name}\\n"); export default {};`,
      );
    const start = (env, script) =>
      node(
        `const { default: server } = await import(process.argv[1]);
         const store = globalThis.store;
         ${script}`,
        [pathToFileURL(path.join(capture, "index.js")).href],
        { cwd: capture, env: { PATH: path.join(capture, "none"), ...env } },
      );

    // The generated Compose environment is exactly what the entrypoint reads.
    const local = yaml.parse(read("docker-compose.yaml")).services.main
      .environment;
    const started = start(
      local,
      `const crypto = await import("node:crypto");
       const signature = await store.signFn("block-hash");
       const key = Buffer.from(await store.blockPublisherPublicKeyFn()).toString("base64");
       console.log(JSON.stringify({
         server,
         connection: store.connection,
         namespace: store.namespace,
         schema: store.schema,
         indexes: store.indexes,
         isPublic: store.isPublic,
         handlers: Object.keys(store.handlers),
         verified: crypto.createVerify("SHA256").update("block-hash")
           .verify(Buffer.from(key, "base64").toString("utf8"), signature, "base64"),
         encrypted: await store.encryptFn("payload"),
         block: await store.createBlockFn(),
         published: await store.publishFn({}, "topic").then(() => true, () => false),
       }));`,
    );
    assert.equal(started.status, 0, started.stderr);
    const output = JSON.parse(started.stdout);
    assert.deepEqual(output, {
      server: "listening",
      connection: {
        host: "postgres",
        database: "blossm",
        user: "tester",
        password: "local-fixture-only",
        max: 2,
      },
      namespace: "core_session",
      schema: procedure.schema,
      indexes: procedure.indexes,
      isPublic: false,
      handlers: ["start"],
      verified: true,
      encrypted: output.encrypted,
      block: { domain: "session", service: "core" },
      published: false,
    });
    assert(Buffer.from(output.encrypted, "base64").length > "payload".length);
    assert(!output.encrypted.includes("payload"));
    assert(!fs.existsSync(loaded), "local mode must not load a cloud client");

    const incomplete = { ...local };
    delete incomplete.PG_PASSWORD;
    const refused = start(incomplete, "");
    assert.notEqual(refused.status, 0);
    assert.match(refused.stderr, /Missing PostgreSQL configuration: PG_PASSWORD/);

    // Deployed mode uses the Cloud Run variables and the cloud-backed functions.
    const { variables } = deployment(yaml.parse(read("build.yaml")));
    const deployed = start(
      { ...variables, PG_PASSWORD: "bound-by-cloud-run" },
      "console.log(JSON.stringify(store.connection));",
    );
    assert.equal(deployed.status, 0, deployed.stderr);
    assert.deepEqual(JSON.parse(deployed.stdout), {
      host: "/cloudsql/blossm-network-development:us-east1:blossm-pg",
      database: "blossm",
      user: "blossm_runtime",
      password: "bound-by-cloud-run",
      max: 2,
    });
    assert.deepEqual(fs.readFileSync(loaded, "utf8").trim().split("\n").sort(), [
      "kms",
      "pubsub",
      "queue",
      "token",
    ]);
  });

  it("declares the Mongo store's dependencies with only the adapter replaced", () => {
    const [mongo, postgres] = ["deploy", "postgres/deploy"].map((directory) =>
      JSON.parse(
        fs.readFileSync(
          path.join(scriptDir, "..", directory, "src/base_config.json"),
          "utf8",
        ),
      ),
    );
    const expected = { ...mongo.dependencies };
    delete expected["@blossm/mongodb-event-store"];
    // Only the Mongo entrypoint reads its password through this client.
    delete expected["@blossm/gcp-secret"];
    expected["@blossm/postgres-event-store"] = "*";
    assert.deepEqual(postgres.dependencies, expected);
    assert.deepEqual(postgres.devDependencies, mongo.devDependencies);
  });
});

describe("Task queue region", () => {
  const rootDir = (region) => ({
    config: () => ({
      vendors: {
        cloud: {
          gcp: {
            projects: { development: "project" },
            computeUrlIds: { development: "id" },
            ...(region && { defaults: { region } }),
          },
        },
      },
    }),
  });
  const normalize = (overrides) => async ({ flags }) => ({
    path: ".",
    name: "queue",
    ...Object.fromEntries(
      flags.map((flag) => [flag.name, overrides[flag.name] ?? flag.default]),
    ),
  });

  for (const [configured, flag, expected] of [
    ["us-east1", undefined, "us-east1"],
    ["us-east1", "europe-west1", "europe-west1"],
    [undefined, undefined, "us-central1"],
  ]) {
    it(`creates a queue in ${expected} (configured ${configured}, flag ${flag})`, async () => {
      let created;
      const create = await load("blossm/src/queue/create/index.js", {
        inquirer: { prompt: async () => ({}) },
        normalize: normalize({ region: flag }),
        roboSay: (value) => value,
        gcpQueue: { create: async (options) => (created = options) },
        rootDir: rootDir(configured),
        console: { log: () => {} },
      });
      await create([]);
      assert.deepEqual(created, {
        project: "project",
        location: expected,
        name: "queue",
      });
    });

    it(`executes through a queue in ${expected} (configured ${configured}, flag ${flag})`, async () => {
      let queue, task;
      const execute = await load("utils/execute_cli_template/index.js", {
        normalize: normalize({ region: flag }),
        roboSay: (value) => value,
        fs: {
          readFileSync: () =>
            yaml.stringify({
              procedure: "command",
              service: "core",
              domain: "session",
              name: "start",
            }),
        },
        rootDir: rootDir(configured),
        path,
        yaml,
        gcpQueue: {
          enqueue: (options) => {
            queue = options;
            return async (value) => (task = value);
          },
        },
        console: { log: () => {} },
      });
      await execute({ domain: "command" })([], () => ({
        operationName: "name",
        operationHash: "hash",
      }));
      assert.equal(queue.location, expected);
      assert.equal(queue.queue, "command-core-session-start");
      assert.equal(
        task.url,
        `https://${expected}-name-hash-id.${expected}.run.app/`,
      );
    });
  }
});

describe("Environment hostname prefixes", () => {
  it("keeps the historical prefixes by default", () => {
    for (const [env, prefix] of [
      ["production", ""],
      ["sandbox", "snd."],
      ["staging", "stg."],
      ["development", "dev."],
    ]) {
      assert.equal(environmentPrefix(env), prefix);
      assert.equal(environmentPrefix(env, {}), prefix);
      assert.equal(
        environmentPrefix(env, { environmentPrefixes: { other: "x." } }),
        prefix,
      );
    }
  });
  it("uses configured prefixes, including an explicitly empty one", () => {
    const config = {
      environmentPrefixes: {
        development: "development.",
        staging: "",
        production: "",
      },
    };
    assert.equal(environmentPrefix("development", config), "development.");
    assert.equal(environmentPrefix("staging", config), "");
    assert.equal(environmentPrefix("production", config), "");
    assert.equal(environmentPrefix("sandbox", config), "snd.");
  });
  it("rejects a prefix that cannot form a hostname", () => {
    for (const prefix of ["development", "dev..", ".dev.", "Dev.", "a/b.", 1])
      assert.throws(
        () =>
          environmentPrefix("development", {
            environmentPrefixes: { development: prefix },
          }),
        /environmentPrefixes\.development/,
      );
  });
});
