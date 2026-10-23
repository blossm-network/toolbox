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
      import.meta.url
    );
    const require = createRequire(file);
    const source = readFileSync(file, "utf8")
      .replace(
        'import rootDir from "@blossm/cli-root-dir";',
        `const rootDir = { path: () => ${JSON.stringify(directory)} };`
      )
      .replace(
        /from "([^"]+)"/g,
        (_, name) =>
          `from ${JSON.stringify(
            name.startsWith(".")
              ? new URL(name, file).href
              : ["path"].includes(name)
              ? `node:${name}`
              : pathToFileURL(require.resolve(name)).href
          )}`
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
      const dependencies = ["team", "other"].map((context) => ({
        procedure,
        context,
        name: "summary",
      }));
      const result = services({
        config: { context: "caller", testing: { dependencies } },
        containerRegistery: "registry",
        network: "example.test",
      });
      const peers = Object.values(result);
      assert.equal(peers.length, 2);
      assert.equal(new Set(peers.map((peer) => peer.container_name)).size, 2);
      for (let i = 0; i < dependencies.length; i++) {
        assert.equal(peers[i].environment.CONTEXT, dependencies[i].context);
        assert.equal(
          peers[i].image,
          mainService({ ...dependencies[i], containerRegistery: "registry" })
            .image
        );
      }
    });
  }
});
