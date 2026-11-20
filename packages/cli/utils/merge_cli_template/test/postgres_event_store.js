import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import yaml from "yaml";

import loadServices from "./load_services.js";
import { load } from "../../../blossm/test/load.js";
import eventStoreBuild from "../src/write_build/event_store.js";
import writeBuild from "../src/write_build/index.js";
import mainService from "../src/write_compose/main_service.js";
import databaseService from "../src/write_compose/database_service.js";
import postgresService, {
  postgresServiceKey,
  postgresReady,
} from "../src/write_compose/postgres_service.js";
import databaseName from "../src/database_name.js";
import {
  eventStoreKind,
  postgresConnection,
  registry,
  buildServiceAccount,
  cloudRun,
} from "../src/deployment_config.js";

// These generators only describe builds and Compose files. Nothing here runs
// gcloud, Docker or a database.
const env = "development";
const profile = () => ({
  defaults: { eventStore: "postgres" },
  vendors: {
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
    cloud: {
      gcp: {
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
      },
    },
  },
});

const store = {
  procedure: "event-store",
  service: "core",
  domain: "session",
  actions: ["start"],
  region: "us-east1",
  project: "blossm-network-development",
  serviceName: "us-east1-store-hash",
  blockSchedule: "0 5 * * *",
  mongodbUser: "mongo-user",
  mongodbHost: "mongo-host",
  mongodbProtocol: "mongodb+srv",
};

const deployment = (steps) => {
  const flat = steps.flat();
  const deploy = flat.find((step) => step.args?.includes("deploy"));
  const variables = JSON.parse(
    Buffer.from(flat[flat.indexOf(deploy) - 1].args.at(-1), "base64").toString(),
  );
  return { flat, deploy, variables };
};
const flag = (step, name) =>
  step.args.filter((arg) => arg == name || arg.startsWith(`${name}=`));

describe("PostgreSQL event-store deployment profile", () => {
  it("reads the development profile", () => {
    const config = profile();
    assert.equal(eventStoreKind(config), "postgres");
    assert.deepEqual(postgresConnection({ env, config }), {
      database: "blossm",
      user: "blossm_runtime",
      max: 2,
      cloudSqlInstance: "blossm-network-development:us-east1:blossm-pg",
      passwordSecret: "blossm-postgres-password:1",
    });
    assert.deepEqual(cloudRun({ env, config }), {
      serviceAccount:
        "blossm-session@blossm-network-development.iam.gserviceaccount.com",
      vpcConnector: null,
      ingress: "all",
      maxInstances: 1,
      minInstances: 0,
    });
    assert.equal(
      registry({ env, config }),
      "us-east1-docker.pkg.dev/blossm-network-development/blossm",
    );
    assert.equal(
      buildServiceAccount({ env, config }),
      "blossm-build@blossm-network-development.iam.gserviceaccount.com",
    );
  });

  it("keeps historical defaults when the optional profile is omitted", () => {
    const config = { vendors: { cloud: { gcp: {} } } };
    assert.equal(eventStoreKind(config), "mongodb");
    assert.equal(eventStoreKind({ defaults: { eventStore: "mongodb" } }), "mongodb");
    assert.equal(registry({ env, config }), undefined);
    assert.equal(buildServiceAccount({ env, config }), undefined);
    assert.deepEqual(cloudRun({ env, config }), {
      serviceAccount: undefined,
      vpcConnector: undefined,
      ingress: undefined,
      maxInstances: undefined,
      minInstances: undefined,
    });
    // Another environment's explicit choice is not inherited.
    assert.equal(
      cloudRun({ env: "production", config: profile() }).vpcConnector,
      undefined,
    );
  });

  const own = "blossm-session-start@blossm-network-development.iam.gserviceaccount.com";
  const root = profile().vendors.cloud.gcp.runtimeServiceAccounts.development;
  const identity = (procedure, config = profile()) =>
    cloudRun({ env, config, procedure }).serviceAccount;

  it("prefers the procedure's runtime identity for the selected environment", () => {
    assert.equal(
      identity({ runtimeServiceAccounts: { development: own } }),
      own,
    );
    // The other Cloud Run options still come from config.yaml.
    assert.deepEqual(
      cloudRun({
        env,
        config: profile(),
        procedure: { runtimeServiceAccounts: { development: own } },
      }),
      { ...cloudRun({ env, config: profile() }), serviceAccount: own },
    );
  });

  it("falls back to config.yaml when the procedure names no identity for the environment", () => {
    assert.equal(identity({}), root);
    assert.equal(identity({ runtimeServiceAccounts: { production: own } }), root);
    // With neither configured, the deploy step keeps its own default.
    assert.equal(
      identity(
        { runtimeServiceAccounts: { production: own } },
        { vendors: { cloud: { gcp: {} } } },
      ),
      undefined,
    );
  });

  for (const [name, runtimeServiceAccounts] of [
    ["null", null],
    ["empty", {}],
    ["text", own],
    ["list", [own]],
    ["null entry", { development: null }],
    ["empty entry", { development: "" }],
    ["public member", { development: "allUsers" }],
    ["non-service account", { development: "someone@example.com" }],
    // Every entry is checked, not only the selected environment.
    ["invalid other environment", { development: own, production: "" }],
  ]) {
    it(`rejects a procedure runtime identity override: ${name}`, () => {
      assert.throws(
        () => identity({ runtimeServiceAccounts }),
        /blossm\.yaml runtimeServiceAccounts.* must be /,
      );
    });
  }

  const connection = (config) =>
    config.vendors.eventStore.postgres.connections.development;
  for (const [name, mutate, read = postgresConnection] of [
    ["unknown event store", (c) => (c.defaults.eventStore = "mysql"), ({ config }) => eventStoreKind(config)],
    ["missing connection", (c) => delete c.vendors.eventStore.postgres],
    ["another environment only", (c) => {
      c.vendors.eventStore.postgres.connections = { production: connection(c) };
    }],
    ["missing database", (c) => delete connection(c).database],
    ["unsafe database", (c) => (connection(c).database = "blossm;drop")],
    ["missing user", (c) => delete connection(c).user],
    ["zero pool", (c) => (connection(c).max = 0)],
    ["text pool", (c) => (connection(c).max = "2")],
    ["missing instance", (c) => delete connection(c).cloudSqlInstance],
    ["bare instance", (c) => (connection(c).cloudSqlInstance = "blossm-pg")],
    ["instance injection", (c) => (connection(c).cloudSqlInstance = "a:b:c,d:e:f")],
    ["missing secret", (c) => delete connection(c).passwordSecret],
    ["secret path injection", (c) => (connection(c).passwordSecret.name = "a:1,B=c")],
    ["unpinned secret", (c) => (connection(c).passwordSecret.version = "latest")],
    ["missing secret version", (c) => delete connection(c).passwordSecret.version],
    ["invalid registry", (c) => (c.vendors.cloud.gcp.registries.development = "bad registry"), registry],
    ["invalid build account", (c) => (c.vendors.cloud.gcp.buildServiceAccounts.development = "someone@example.com"), buildServiceAccount],
    ["invalid runtime account", (c) => (c.vendors.cloud.gcp.runtimeServiceAccounts.development = "allUsers"), cloudRun],
    ["invalid connector", (c) => (c.vendors.cloud.gcp.vpcConnectors.development = false), cloudRun],
    ["invalid ingress", (c) => (c.vendors.cloud.gcp.ingress.development = "public"), cloudRun],
    ["zero max instances", (c) => (c.vendors.cloud.gcp.maxInstances.development = 0), cloudRun],
    ["negative min instances", (c) => (c.vendors.cloud.gcp.minInstances.development = -1), cloudRun],
    ["min above max", (c) => (c.vendors.cloud.gcp.minInstances.development = 2), cloudRun],
  ]) {
    it(`rejects ${name}`, () => {
      const config = profile();
      mutate(config);
      assert.throws(() => read({ env, config }), /config\.yaml .* must be /);
    });
  }
});

describe("PostgreSQL event-store build", () => {
  const generate = (overrides = {}) => {
    const config = profile();
    return eventStoreBuild({
      ...store,
      strict: true,
      eventStoreKind: "postgres",
      postgres: postgresConnection({ env, config }),
      cloudRun: cloudRun({ env, config }),
      containerRegistery: registry({ env, config }),
      ...overrides,
    });
  };

  it("deploys with the Cloud SQL socket, secret binding and identity", () => {
    const { flat, deploy, variables } = deployment(generate());
    assert.deepEqual(deploy.args.slice(0, 3), [
      "run",
      "deploy",
      "us-east1-store-hash",
    ]);
    assert.deepEqual(flag(deploy, "--image"), [
      "--image=us-east1-docker.pkg.dev/blossm-network-development/blossm/event-store",
    ]);
    assert.deepEqual(flag(deploy, "--add-cloudsql-instances"), [
      "--add-cloudsql-instances=blossm-network-development:us-east1:blossm-pg",
    ]);
    assert.deepEqual(flag(deploy, "--set-secrets"), [
      "--set-secrets=PG_PASSWORD=blossm-postgres-password:1",
    ]);
    assert.deepEqual(flag(deploy, "--service-account"), [
      "--service-account=blossm-session@blossm-network-development.iam.gserviceaccount.com",
    ]);
    assert.deepEqual(flag(deploy, "--max-instances"), ["--max-instances=1"]);
    assert.deepEqual(flag(deploy, "--min-instances"), ["--min-instances=0"]);
    assert.deepEqual(variables, {
      ...variables,
      PG_HOST: "/cloudsql/blossm-network-development:us-east1:blossm-pg",
      PG_DATABASE: "blossm",
      PG_USER: "blossm_runtime",
      PG_MAX: "2",
      PG_NAMESPACE: "core_session",
      GCP_REGION: "us-east1",
      DOMAIN: "session",
      SERVICE: "core",
    });
    // The password is bound by Cloud Run and never enters the build.
    assert.equal(Object.hasOwn(variables, "PG_PASSWORD"), false);
    assert(!Object.keys(variables).some((key) => key.startsWith("MONGODB_")));
    assert(!JSON.stringify(flat).includes("local-fixture-only"));
  });

  it("denies public access and clears the connector when one is disabled", () => {
    const { deploy } = deployment(generate());
    assert.deepEqual(flag(deploy, "--ingress"), ["--ingress=all"]);
    assert.deepEqual(flag(deploy, "--no-allow-unauthenticated"), [
      "--no-allow-unauthenticated",
    ]);
    assert.deepEqual(flag(deploy, "--allow-unauthenticated"), []);
    // Cloud Run keeps a previous revision's connector unless it is cleared.
    assert.deepEqual(flag(deploy, "--clear-vpc-connector"), [
      "--clear-vpc-connector",
    ]);
    assert.deepEqual(flag(deploy, "--vpc-connector"), []);
    assert.deepEqual(flag(deploy, "--vpc-egress"), []);
    assert(!JSON.stringify(deploy).includes("allUsers"));
  });

  it("attaches a configured connector beside the Cloud SQL socket", () => {
    const config = profile();
    config.vendors.cloud.gcp.vpcConnectors.development = "blossm-connector";
    const { deploy } = deployment(
      generate({ cloudRun: cloudRun({ env, config }) }),
    );
    assert.deepEqual(flag(deploy, "--vpc-connector"), [
      "--vpc-connector=blossm-connector",
    ]);
    assert.deepEqual(flag(deploy, "--vpc-egress"), ["--vpc-egress=all"]);
    assert.deepEqual(flag(deploy, "--clear-vpc-connector"), []);
    assert.deepEqual(flag(deploy, "--add-cloudsql-instances"), [
      "--add-cloudsql-instances=blossm-network-development:us-east1:blossm-pg",
    ]);
  });

  it("provisions both task queues in the service region", () => {
    const { flat } = deployment(generate());
    for (const name of [
      "event-store-core-session",
      "event-store-core-session-create-block",
    ]) {
      const create = flat.filter((step) =>
        JSON.stringify(step.args).includes(`"tasks","queues","create","${name}"`),
      );
      const update = flat.filter((step) =>
        JSON.stringify(step.args).includes(`"tasks","queues","update","${name}"`),
      );
      assert.equal(create.length, 1, name);
      assert.equal(update.length, 1, name);
      // Describe and create target the same location as the runtime enqueue.
      assert.equal(flag(create[0], "--location").length, 2);
      for (const step of [...create, ...update])
        for (const location of flag(step, "--location"))
          assert.equal(location, "--location=us-east1");
    }
    assert(!JSON.stringify(flat).includes("us-central1"));
    // The Scheduler job that drives block creation remains its own resource.
    assert.equal(
      flat.filter((step) =>
        JSON.stringify(step.args).includes(
          `"scheduler","jobs","create","http","event-store-core-session-create-block"`,
        ),
      ).length,
      1,
    );
  });

  it("keeps deployment keys but touches no cloud resource in a test-only build", () => {
    const kms = (steps) =>
      steps
        .flat()
        .filter(
          (step) =>
            step.args?.includes("kms") &&
            !step.args.includes("add-iam-policy-binding"),
        );
    assert.equal(kms(generate()).length, 3);
    const local = generate({ strict: false, postgres: undefined }).flat();
    assert.deepEqual(
      local.filter((step) => step.name == "gcr.io/cloud-builders/gcloud"),
      [],
    );
    assert(!JSON.stringify(local).includes("blossm-postgres-password"));
    // Mongo's local block creation still signs with KMS.
    assert.equal(
      kms(eventStoreBuild({ ...store, strict: false })).length,
      3,
    );
  });

  it("leaves a Mongo deployment on its connector, ingress and database", () => {
    const { flat, deploy, variables } = deployment(
      eventStoreBuild({ ...store, strict: true, containerRegistery: "us.gcr.io/p" }),
    );
    assert.deepEqual(flag(deploy, "--vpc-connector"), [
      "--vpc-connector=us-east1-network",
    ]);
    assert.deepEqual(flag(deploy, "--vpc-egress"), ["--vpc-egress=all"]);
    assert.deepEqual(flag(deploy, "--clear-vpc-connector"), []);
    assert.deepEqual(flag(deploy, "--ingress"), ["--ingress=internal"]);
    assert.deepEqual(flag(deploy, "--allow-unauthenticated"), []);
    // The default identity is named so the store's grants match the revision.
    assert.deepEqual(flag(deploy, "--service-account"), [
      "--service-account=${PROJECT_NUMBER}-compute@developer.gserviceaccount.com",
    ]);
    for (const name of [
      "--max-instances",
      "--min-instances",
      "--add-cloudsql-instances",
      "--set-secrets",
    ])
      assert.deepEqual(flag(deploy, name), [], name);
    assert.equal(variables.MONGODB_DATABASE, "core_session");
    assert.equal(variables.MONGODB_USER, "mongo-user");
    assert.equal(variables.MONGODB_HOST, "mongo-host");
    assert.equal(variables.MONGODB_PROTOCOL, "mongodb+srv");
    assert(!Object.keys(variables).some((key) => key.startsWith("PG_")));
    assert(!JSON.stringify(flat).includes("cloudsql"));
  });

  it("submits under the build identity only when one is configured", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "blossm-pg-build-"));
    try {
      const write = (overrides) => {
        writeBuild({
          ...store,
          workingDir: directory,
          strict: true,
          operationName: "store",
          operationHash: "hash",
          ...overrides,
        });
        return yaml.parse(
          readFileSync(path.join(directory, "build.yaml"), "utf8"),
        );
      };
      const config = profile();
      const build = write({
        eventStore: "postgres",
        postgres: postgresConnection({ env, config }),
        cloudRun: cloudRun({ env, config }),
        buildServiceAccount: buildServiceAccount({ env, config }),
      });
      assert.equal(
        build.serviceAccount,
        "projects/blossm-network-development/serviceAccounts/blossm-build@blossm-network-development.iam.gserviceaccount.com",
      );
      assert.deepEqual(build.options, { logging: "CLOUD_LOGGING_ONLY" });
      assert(
        build.steps.some((step) =>
          step.args?.includes("--set-secrets=PG_PASSWORD=blossm-postgres-password:1"),
        ),
      );
      assert.deepEqual(Object.keys(write({})), ["steps"]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("creates every procedure's queues in its own region", () => {
    for (const procedure of ["command", "job", "projection", "view-store"]) {
      const directory = mkdtempSync(path.join(tmpdir(), "blossm-pg-queue-"));
      try {
        writeBuild({
          workingDir: directory,
          procedure,
          strict: true,
          actions: [],
          events: [],
          name: "read",
          domain: "session",
          service: "core",
          region: "europe-west1",
          project: "p",
          operationName: "operation",
          operationHash: "hash",
        });
        const { steps } = yaml.parse(
          readFileSync(path.join(directory, "build.yaml"), "utf8"),
        );
        const queues = steps.filter(
          (step) => step.args.includes("tasks") && step.args.includes("queues"),
        );
        assert(queues.length >= 2, procedure);
        for (const step of queues) {
          const locations = flag(step, "--location");
          assert(locations.length, procedure);
          for (const location of locations)
            assert.equal(location, "--location=europe-west1", procedure);
        }
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    }
  });
});

describe("PostgreSQL event-store local fixture", () => {
  let directory;
  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), "blossm-pg-compose-"));
  });
  afterEach(() => rmSync(directory, { recursive: true, force: true }));
  const generate = async (overrides = {}) => {
    const write = await load(
      "utils/merge_cli_template/src/write_compose/index.js",
      {
        fs: { writeFileSync },
        yaml,
        path,
        mainService,
        databaseService,
        postgresService,
        postgresServiceKey,
        postgresReady,
        databaseName,
        procedureServices: await loadServices(directory, {
          network: "test.network",
        }),
      },
    );
    write({
      config: { procedure: "event-store", testing: { dependencies: [] } },
      procedure: "event-store",
      service: "core",
      domain: "session",
      workingDir: directory,
      containerRegistery: "registry",
      network: "test.network",
      mainContainerName: "main",
      project: "blossm-network-development",
      eventStore: "postgres",
      ...overrides,
    });
    const file = readFileSync(
      path.join(directory, "docker-compose.yaml"),
      "utf8",
    );
    return { file, ...yaml.parse(file) };
  };

  it("runs the store against a disposable PostgreSQL 17 service", async () => {
    const { file, services } = await generate();
    assert.deepEqual(Object.keys(services).sort(), ["main", "postgres"]);
    assert.match(services.postgres.image, /^postgres:17\.\d+@sha256:[0-9a-f]{64}$/);
    const fixture = services.postgres.environment;
    const main = services.main.environment;
    assert.equal(main.NODE_ENV, "local");
    assert.equal(main.PG_HOST, services.postgres.container_name);
    assert.equal(main.PG_DATABASE, fixture.POSTGRES_DB);
    assert.equal(main.PG_USER, fixture.POSTGRES_USER);
    assert.equal(main.PG_PASSWORD, fixture.POSTGRES_PASSWORD);
    assert.equal(main.PG_MAX, "2");
    assert.equal(main.PG_NAMESPACE, "core_session");
    assert.deepEqual(services.main.depends_on, {
      postgres: { condition: "service_healthy" },
    });
    assert(services.postgres.healthcheck.test.includes("pg_isready"));
    // No Mongo fixture, and nothing from the deployment profile.
    assert(!Object.keys(main).some((key) => key.startsWith("MONGODB_")));
    for (const value of [
      "blossm_runtime",
      "blossm-network-development:us-east1:blossm-pg",
      "blossm-postgres-password",
    ])
      assert(!file.includes(value), value);
    assert(!file.includes("cloudsql"));
    assert.equal(fixture.POSTGRES_PASSWORD, "local-fixture-only");
  });

  it("gives dependent stores their own namespaces and keeps Mongo for views", async () => {
    const { services } = await generate({
      procedure: "command",
      name: "start",
      config: {
        procedure: "command",
        testing: {
          dependencies: [
            { procedure: "event-store", service: "core", domain: "session" },
            { procedure: "event-store", service: "core", domain: "role" },
            { procedure: "view-store", context: "team", name: "summary" },
          ],
        },
      },
    });
    const stores = Object.values(services).filter(
      (service) => service.environment?.PROCEDURE == "event-store",
    );
    assert.deepEqual(
      stores.map((service) => service.environment.PG_NAMESPACE).sort(),
      ["core_role", "core_session"],
    );
    for (const service of stores) {
      assert.equal(service.environment.PG_HOST, "postgres");
      assert.equal(service.environment.MONGODB_DATABASE, undefined);
      assert.deepEqual(service.depends_on, {
        postgres: { condition: "service_healthy" },
      });
    }
    assert.deepEqual(JSON.parse(services.db.environment.MONGODB_DATABASES), [
      "team_summary",
    ]);
    assert.ok(services.postgres);
    assert.equal(services.main.environment.PG_HOST, undefined);
    assert(Array.isArray(services.main.depends_on));
  });

  it("adds no PostgreSQL service without an event store", async () => {
    const { services } = await generate({
      procedure: "view-store",
      name: "summary",
      config: { procedure: "view-store", testing: { dependencies: [] } },
    });
    assert.deepEqual(Object.keys(services).sort(), ["db", "main"]);
  });

  it("keeps the Mongo fixture when Mongo is selected", async () => {
    const { services } = await generate({ eventStore: "mongodb" });
    assert.deepEqual(Object.keys(services).sort(), ["db", "main"]);
    assert.equal(services.main.environment.MONGODB_DATABASE, "core_session");
    assert.deepEqual(services.main.depends_on, ["db"]);
  });
});
