import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import yaml from "yaml";
import { spawnSync } from "node:child_process";
import { runInNewContext } from "node:vm";

import loadServices from "./load_services.js";
import { load } from "../../../blossm/test/load.js";
import mainService from "../src/write_compose/main_service.js";
import databaseService from "../src/write_compose/database_service.js";
import databaseName from "../src/database_name.js";

describe("Compose store database isolation", () => {
  let directory;
  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), "blossm-databases-"));
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
        databaseName,
        procedureServices: await loadServices(directory, {
          network: "test.network",
        }),
      },
    );
    write({
      config: {
        procedure: "view-store",
        testing: {
          dependencies: [
            { procedure: "view-store", context: "team", name: "summary" },
            { procedure: "view-store", context: "other", name: "summary" },
            { procedure: "event-store", service: "core", domain: "ledger" },
            { procedure: "event-store", service: "core", domain: "profile" },
            { procedure: "event-store", service: "core", domain: "ledger" },
          ],
        },
      },
      procedure: "view-store",
      context: "team",
      name: "dashboard",
      workingDir: directory,
      containerRegistery: "registry",
      network: "test.network",
      mainContainerName: "main",
      ...overrides,
    });
    return yaml.parse(
      readFileSync(path.join(directory, "docker-compose.yaml"), "utf8"),
    );
  };
  it("uses production identities for every store and deduplicates the fixture database list", async () => {
    const { services } = await generate();
    const names = Object.values(services)
      .filter((service) => service.environment?.MONGODB_DATABASE)
      .map((service) => service.environment.MONGODB_DATABASE);
    assert.deepEqual(names.sort(), [
      "core_ledger",
      "core_profile",
      "other_summary",
      "team_dashboard",
      "team_summary",
    ]);
    assert.deepEqual(
      JSON.parse(services.db.environment.MONGODB_DATABASES).sort(),
      names,
    );
  });
  for (const [config, expected] of [
    [
      {
        procedure: "event-store",
        service: "core",
        domain: "ledger",
        context: undefined,
        name: undefined,
      },
      "core_ledger",
    ],
    [
      { procedure: "view-store", name: "summary", context: undefined },
      "summary",
    ],
  ]) {
    it(`assigns main store ${expected} and its fixture grant together`, async () => {
      const { services } = await generate({
        ...config,
        config: { ...config, testing: { dependencies: [] } },
      });
      assert.equal(services.main.environment.MONGODB_DATABASE, expected);
      assert.deepEqual(JSON.parse(services.db.environment.MONGODB_DATABASES), [
        expected,
      ]);
      assert(services.main.depends_on.includes("db"));
    });
  }
  it("provides Mongo for a non-store procedure's store dependency", async () => {
    const { services } = await generate({
      procedure: "command",
      config: {
        procedure: "command",
        testing: {
          dependencies: [
            { procedure: "event-store", service: "core", domain: "ledger" },
          ],
        },
      },
    });
    assert.equal(services.main.environment.MONGODB_DATABASE, undefined);
    assert.deepEqual(JSON.parse(services.db.environment.MONGODB_DATABASES), [
      "core_ledger",
    ]);
    const peer = Object.values(services).find(
      (service) => service.environment?.PROCEDURE === "event-store",
    );
    assert.equal(peer.environment.MONGODB_DATABASE, "core_ledger");
    assert(peer.depends_on.includes("db"));
  });
  it("does not add a database to a procedure without store dependencies", async () => {
    const { services } = await generate({
      procedure: "command",
      config: { procedure: "command", testing: { dependencies: [] } },
    });
    assert.deepEqual(Object.keys(services), ["main"]);
    assert.equal(services.main.environment.NODE_ENV, "local");
    assert.equal(services.main.environment.MONGODB_DATABASE, undefined);
  });
  it("grants the fixture user exactly the generated store databases", async () => {
    const { services } = await generate();
    const executable = path.join(directory, "mongosh");
    writeFileSync(executable, "#!/bin/sh\n/bin/cat\n", { mode: 0o755 });
    const env = { PATH: directory, ...services.db.environment };
    const script = new URL("../template/mongodb-init.sh", import.meta.url);
    const result = spawnSync("/bin/bash", [script.pathname], {
      env,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    let database, user;
    runInNewContext(result.stdout, {
      process: { env },
      db: {
        getSiblingDB: (name) => {
          database = name;
          return {
            createUser: (value) => {
              user = value;
            },
          };
        },
      },
    });
    assert.equal(database, "admin");
    assert.deepEqual(JSON.parse(JSON.stringify(user)), {
      user: services.db.environment.MONGODB_USER,
      pwd: services.db.environment.MONGODB_USER_PASSWORD,
      roles: JSON.parse(services.db.environment.MONGODB_DATABASES).flatMap(
        (db) => [
          { role: "readWrite", db },
          { role: "dbAdmin", db },
        ],
      ),
    });
  });
});
