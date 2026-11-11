import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import mainService from "../src/write_compose/main_service.js";

describe("Contextual Compose dependencies", () => {
  let directory;
  let services;
  beforeEach(async () => {
    directory = mkdtempSync(path.join(tmpdir(), "blossm-compose-"));
    const file = new URL(
      "../src/write_compose/procedure_services.js",
      import.meta.url,
    );
    const require = createRequire(file);
    const source = readFileSync(file, "utf8")
      .replace(
        'import rootDir from "@blossm/cli-root-dir";',
        `const rootDir = { path: () => ${JSON.stringify(directory)} };`,
      )
      .replace(
        /from "([^"]+)"/g,
        (_, name) =>
          `from ${JSON.stringify(
            name.startsWith(".")
              ? new URL(name, file).href
              : ["path"].includes(name)
                ? `node:${name}`
                : pathToFileURL(require.resolve(name)).href,
          )}`,
      );
    services = (
      await import(
        `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
      )
    ).default;
  });
  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });
  for (const procedure of ["view-store", "view-composite"]) {
    it(`keeps distinct ${procedure} contexts and matches main image naming`, () => {
      const dependencies = ["team", "other", undefined].map((context) => ({
        procedure,
        context,
        name: "summary",
      }));
      const result = services({
        config: { context: "caller", testing: { dependencies } },
        containerRegistery: "registry",
        databaseServiceKey: "db",
        port: 80,
        network: "example.test",
      });
      const peers = Object.values(result).filter(
        (service) => service.environment?.PROCEDURE === procedure,
      );
      assert.equal(peers.length, 3);
      assert.equal(new Set(peers.map((peer) => peer.container_name)).size, 3);
      for (let i = 0; i < dependencies.length; i++) {
        assert.equal(peers[i].environment.CONTEXT, dependencies[i].context);
        assert.equal(
          peers[i].image,
          mainService({ ...dependencies[i], containerRegistery: "registry" })
            .image,
        );
      }
    });
  }
  it("keeps a same-name/context store and composite as separate services", () => {
    const dependencies = ["view-store", "view-composite"].map((procedure) => ({
      procedure,
      context: "team",
      name: "summary",
    }));
    const result = services({
      config: { context: "caller", testing: { dependencies } },
      containerRegistery: "registry",
      databaseServiceKey: "db",
      network: "example.test",
      port: 80,
    });
    const peers = Object.entries(result).filter(
      ([, service]) => service.environment?.NAME === "summary",
    );
    assert.equal(peers.length, 2);
    for (const [key, peer] of peers)
      assert.equal(key, peer.environment.OPERATION_HASH);
    assert.equal(new Set(peers.map(([, peer]) => peer.container_name)).size, 2);
  });

  for (const procedure of ["view-store", "view-composite"]) {
    it(`retains registry selection for ${procedure}`, () => {
      const dependencies = ["local.core", "external.test"].map(
        (network, i) => ({
          procedure,
          context: "team",
          name: `summary${i}`,
          network,
        }),
      );
      const result = services({
        config: { context: "caller", testing: { dependencies } },
        containerRegistery: "app-registry",
        baseContainerRegistery: "core-registry",
        localCoreNetwork: "local.core",
        databaseServiceKey: "db",
        network: "example.test",
        port: 80,
      });
      const peers = Object.values(result).filter(
        (service) => service.environment?.PROCEDURE === procedure,
      );
      assert.equal(
        peers[0].image,
        `core-registry/${procedure}.team.summary0:latest`,
      );
      assert.equal(
        peers[1].image,
        `app-registry/${procedure}.team.summary1:latest`,
      );
    });
  }
});
