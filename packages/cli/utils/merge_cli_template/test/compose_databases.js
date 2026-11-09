import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire, isBuiltin } from "node:module";
import { pathToFileURL } from "node:url";
import yaml from "yaml";
import { spawnSync } from "node:child_process";
import { runInNewContext } from "node:vm";

const moduleUrl = (file, replacements = {}) => {
  const require = createRequire(file);
  const source = readFileSync(file, "utf8")
    .replace(
      /import rootDir from "@blossm\/cli-root-dir";/,
      replacements.root || "const rootDir = {};"
    )
    .replace(
      /from "([^"]+)"/g,
      (_, name) =>
        `from ${JSON.stringify(
          replacements[name] ||
            (isBuiltin(name)
              ? `node:${name}`
              : name.startsWith(".")
              ? new URL(name, file).href
              : pathToFileURL(require.resolve(name)).href)
        )}`
    );
  return `data:text/javascript;base64,${Buffer.from(source).toString(
    "base64"
  )}`;
};

describe("Compose store database isolation", () => {
  let directory;
  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), "blossm-databases-"));
  });
  afterEach(() => rmSync(directory, { recursive: true, force: true }));
  const generate = async (overrides = {}) => {
    const servicesFile = new URL(
      "../src/write_compose/procedure_services.js",
      import.meta.url
    );
    const composeFile = new URL(
      "../src/write_compose/index.js",
      import.meta.url
    );
    const services = moduleUrl(servicesFile, {
      root: `const rootDir = { path: () => ${JSON.stringify(directory)} };`,
    });
    const write = (
      await import(
        moduleUrl(composeFile, { "./procedure_services.js": services })
      )
    ).default;
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
      readFileSync(path.join(directory, "docker-compose.yaml"), "utf8")
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
      names
    );
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
        ]
      ),
    });
  });
});
