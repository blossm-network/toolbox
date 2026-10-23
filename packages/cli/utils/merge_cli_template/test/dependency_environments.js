import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  symlinkSync,
  rmSync,
  readFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const file = new URL(
  "../src/write_compose/procedure_services.js",
  import.meta.url
);
const require = createRequire(file);

describe("Dependency configuration discovery", () => {
  let directory;
  const config = (folder, values) => {
    mkdirSync(path.join(directory, folder), { recursive: true });
    writeFileSync(
      path.join(directory, folder, "blossm.yaml"),
      JSON.stringify(values)
    );
  };
  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), "blossm-environments-"));
  });
  afterEach(() => rmSync(directory, { recursive: true, force: true }));
  it("matches full procedure identity and skips installed trees and symlink cycles", async () => {
    const base = {
      procedure: "fact",
      name: "summary",
      domain: "records",
      service: "core",
    };
    config("a", {
      ...base,
      context: "other",
      env: { testing: { PEER: "wrong-context" } },
    });
    config("b", {
      ...base,
      context: "team",
      network: "other.test",
      env: { testing: { PEER: "wrong-network" } },
    });
    config("c", {
      ...base,
      context: "team",
      env: { testing: { PEER: "correct" } },
    });
    config("node_modules/ignored", {
      ...base,
      context: "team",
      env: { testing: { PEER: "installed" } },
    });
    symlinkSync(directory, path.join(directory, "cycle"), "dir");
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
              : name === "path"
              ? "node:path"
              : pathToFileURL(require.resolve(name)).href
          )}`
      );
    const services = (
      await import(
        `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
      )
    ).default;
    const result = services({
      config: { testing: { dependencies: [{ ...base, context: "team" }] } },
      env: "testing",
      network: "example.test",
      containerRegistery: "registry",
    });
    assert.equal(Object.values(result)[0].environment.PEER, "correct");
  });
});
