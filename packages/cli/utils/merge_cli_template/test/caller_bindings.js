import assert from "node:assert/strict";
import hash from "@blossm/operation-hash";
import operationShortName from "@blossm/operation-short-name";
import directCallees from "../src/direct_callees.js";
import callerBindings, {
  keyBindings,
} from "../src/write_build/caller_bindings.js";

const runtime = "blossm-start@blossm-dev.iam.gserviceaccount.com";
const executer = "executer@blossm-dev.iam.gserviceaccount.com";
const serviceOf = (...parts) =>
  `us-east1-${operationShortName(parts)}-${hash(...parts)}`;

// One line per rendered binding: "<group> <resource> <member> <role>".
const rendered = (config, { serviceAccount = runtime, coreIsOwn } = {}) =>
  callerBindings({
    procedure: config.procedure,
    name: config.name,
    context: config.context,
    callees: directCallees(config, { coreIsOwn }),
    keys: config.keys,
    cloudRun: { serviceAccount },
    serviceName: "own-service",
    region: "us-east1",
    project: "blossm-dev",
  }).map(({ name, args }) => {
    assert.equal(name, "gcr.io/cloud-builders/gcloud");
    const flag = (key) =>
      args.find((a) => a.startsWith(`--${key}=`)).split("=")[1];
    const at = args.indexOf("add-iam-policy-binding");
    assert.equal(args.at(-1), "--quiet");
    assert(args.includes("--project=blossm-dev"));
    // Service and service-account bindings state that they are unconditional;
    // queue bindings have no such flag.
    assert.equal(args.includes("--condition=None"), args[0] != "tasks");
    return [
      args.slice(0, at).join(" "),
      args[0] == "kms"
        ? `${flag("location")}/${flag("keyring")}/${args[at + 1]}`
        : args[at + 1],
      flag("member").replace("serviceAccount:", ""),
      flag("role").replace("roles/", ""),
    ].join(" ");
  });

const invoker = (service, member) =>
  `run services ${service} ${member} run.invoker`;
const enqueuer = (queue) =>
  `tasks queues ${queue} ${runtime} cloudtasks.enqueuer`;
const actAsExecuter = `iam service-accounts ${executer} ${runtime} iam.serviceAccountUser`;

describe("Caller bindings", () => {
  const start = {
    procedure: "command",
    name: "start",
    domain: "session",
    service: "core",
  };
  const store = serviceOf("session", "core", "event-store");

  it("lets a command be checked in on and reach its own store", () => {
    assert.deepEqual(rendered(start), [
      invoker("own-service", executer),
      invoker(store, runtime),
      enqueuer("event-store-core-session"),
      actAsExecuter,
    ]);
  });

  it("adds declared procedures, never mocked or foreign ones", () => {
    const command = {
      ...start,
      testing: {
        store: false,
        dependencies: [
          {
            procedure: "command",
            name: "upgrade",
            domain: "session",
            service: "core",
          },
          {
            procedure: "fact",
            name: "roles",
            domain: "principal",
            service: "core",
          },
          {
            procedure: "fact",
            name: "mocked",
            domain: "x",
            service: "core",
            mocks: [],
          },
          {
            procedure: "fact",
            name: "foreign",
            domain: "x",
            service: "core",
            network: "n",
          },
          { name: "redis" },
        ],
      },
    };
    assert.deepEqual(rendered(command), [
      invoker("own-service", executer),
      invoker(serviceOf("upgrade", "session", "core", "command"), runtime),
      invoker(serviceOf("roles", "principal", "core", "fact"), runtime),
      enqueuer("command-core-session-upgrade"),
      actAsExecuter,
    ]);
  });

  it("lets a gateway reach only the routes it serves", () => {
    const gateway = {
      procedure: "command-gateway",
      domain: "session",
      service: "core",
      commands: [
        { name: "start", protection: "context" },
        { name: "elsewhere", protection: "none", network: "other.network" },
      ],
    };
    // Public: no invoker binding on the gateway itself, and no queue access.
    assert.deepEqual(rendered(gateway), [
      invoker(serviceOf("start", "session", "core", "command"), runtime),
    ]);
  });

  it("adds the authorization facts for a strict route in the core network", () => {
    const gateway = {
      procedure: "fact-gateway",
      facts: [{ name: "public-key", protection: "none" }, { name: "mine" }],
    };
    const facts = [
      serviceOf("public-key", "fact"),
      serviceOf("mine", "fact"),
      serviceOf("terminated", "session", "core", "fact"),
      serviceOf("deleted", "scene", "core", "fact"),
      serviceOf("roles", "principal", "core", "fact"),
      serviceOf("permissions", "role", "core", "fact"),
    ];
    assert.deepEqual(
      rendered(gateway),
      facts.map((fact) => invoker(fact, runtime)),
    );
    assert.deepEqual(
      rendered(gateway, { coreIsOwn: false }),
      facts.slice(0, 2).map((fact) => invoker(fact, runtime)),
    );
  });

  it("lets a projection read its stores and queue its view store and play", () => {
    const projection = {
      procedure: "projection",
      name: "sessions",
      context: "account",
      events: [{ domain: "session", service: "core", actions: ["start"] }],
    };
    assert.deepEqual(rendered(projection), [
      invoker("own-service", executer),
      invoker(store, runtime),
      invoker(serviceOf("sessions", "account", "view-store"), runtime),
      enqueuer("event-store-core-session"),
      enqueuer("view-store-account-sessions"),
      enqueuer("projection-account-sessions-play"),
      actAsExecuter,
    ]);
  });

  it("grants the declared use of each key and rejects an unknown one", () => {
    const keys = [
      { ring: "jwt", name: "access", use: "sign" },
      { ring: "jwt", name: "access", use: "verify", location: "us-east1" },
    ];
    assert.deepEqual(
      rendered({ procedure: "fact", name: "public-key", keys }),
      [
        invoker("own-service", executer),
        `kms keys global/jwt/access ${runtime} cloudkms.signer`,
        `kms keys us-east1/jwt/access ${runtime} cloudkms.publicKeyViewer`,
      ],
    );
    for (const key of [
      { ring: "jwt", name: "access", use: "admin" },
      { name: "access", use: "sign" },
    ])
      assert.throws(
        () => rendered({ procedure: "fact", keys: [key] }),
        /keys needs/,
      );
  });

  it("grants only the check-in without a configured runtime identity", () => {
    assert.deepEqual(rendered(start, { serviceAccount: null }), [
      invoker("own-service", executer),
    ]);
  });

  it("leaves the event store to its own bindings", () => {
    assert.deepEqual(
      rendered({
        procedure: "event-store",
        domain: "session",
        service: "core",
      }),
      [],
    );
  });
});
