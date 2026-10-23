import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire, isBuiltin } from "node:module";
import { pathToFileURL } from "node:url";
import yaml from "yaml";
import { spawnSync } from "node:child_process";

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

describe("Compose store database isolation and readiness", () => {
  let directory;
  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), "blossm-databases-"));
  });
  afterEach(() => rmSync(directory, { recursive: true, force: true }));
  const generate = async () => {
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
    });
    return yaml.parse(
      readFileSync(path.join(directory, "docker-compose.yaml"), "utf8")
    );
  };
  it("uses production identities for every store and grants only those databases", async () => {
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
  it("waits for replica-set readiness before starting store clients", async () => {
    const { services } = await generate();
    assert.deepEqual(services.db.command, [
      "mongod",
      "--replSet",
      "blossm-test",
      "--bind_ip_all",
    ]);
    assert.deepEqual(services.db.healthcheck.test, [
      "CMD",
      "bash",
      "/docker-entrypoint-initdb.d/mongodb-init.sh",
      "ready",
    ]);
    for (const [key, service] of Object.entries(services))
      if (key !== "db")
        assert.equal(service.depends_on.db.condition, "service_healthy");
    assert.deepEqual(services.db.ports, ["127.0.0.1:27017:27017"]);
  });
  it("leaves the official temporary bootstrap daemon untouched", () => {
    const script = new URL("../template/mongodb-init.sh", import.meta.url);
    assert.equal(spawnSync("bash", [script.pathname, "mongod"]).status, 0);
    writeFileSync(
      path.join(directory, "docker-entrypoint-temp-mongod.pid"),
      "123"
    );
    const guarded = spawnSync("bash", [script.pathname, "ready"], {
      env: { ...process.env, TMPDIR: directory },
      encoding: "utf8",
    });
    assert.equal(guarded.status, 1);
    assert.equal(guarded.stderr, "");
  });
});
