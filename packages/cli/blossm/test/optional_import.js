import assert from "assert";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { pathToFileURL } from "url";
import { cliDir } from "./load.js";
import optionalImport from "../../utils/merge_cli_template/template/optional_import.js";

describe("Generated optional hook imports", () => {
  let directory;
  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), "blossm-hook-"));
    await fs.writeFile(
      path.join(directory, "package.json"),
      JSON.stringify({ type: "module" }),
    );
    await fs.writeFile(
      path.join(directory, "config.json"),
      JSON.stringify({ commands: [], facts: [], schema: {} }),
    );
    await fs.copyFile(
      path.join(cliDir, "utils/merge_cli_template/template/optional_import.js"),
      path.join(directory, "optional_import.js"),
    );
  });
  afterEach(async () => {
    await fs.rm(directory, { recursive: true, force: true });
  });
  const file = (name) => pathToFileURL(path.join(directory, name));
  it("allows an absent hook and loads an actual module default", async () => {
    assert.strictEqual(await optionalImport(file("missing.mjs")), undefined);
    await fs.writeFile(file("valid.mjs"), "export default {hook:true};");
    assert.deepStrictEqual(await optionalImport(file("valid.mjs")), {
      hook: true,
    });
  });
  it("propagates syntax, initialization and nested import failures", async () => {
    for (const [name, source] of [
      ["syntax.mjs", "export default {"],
      ["initialization.mjs", "throw new Error('hook failed');"],
      ["nested.mjs", "import './missing-dependency.mjs'; export default {};"],
    ]) {
      await fs.writeFile(file(name), source);
      await assert.rejects(optionalImport(file(name)));
    }
  });
  for (const [procedure, hook, option] of [
    ["command_gateway", "services", "services"],
    ["fact_gateway", "services", "services"],
    ["view_store", "query", "queryFn"],
  ]) {
    const startup = async (suffix) => {
      // Native ESM executes the actual generated entrypoint and optional import.
      // Only provider/framework imports are replaced; their factories capture options.
      const source = await fs.readFile(
        path.join(cliDir, `blossm/src/${procedure}/deploy/src/index.js`),
        "utf8",
      );
      const stub =
        "data:text/javascript," +
        encodeURIComponent(
          "export default Object.assign((options) => options, { get() {}, verify() {}, download() {} });",
        );
      const entrypoint = file("entry.js");
      await fs.writeFile(
        entrypoint,
        source.replace(/from "@blossm\/[^" ]+"/g, `from "${stub}"`),
      );
      return (await import(`${entrypoint.href}?case=${suffix}`)).default;
    };
    it(`${procedure} starts without an optional hook and loads a present default`, async () => {
      assert.equal((await startup("absent"))[option], undefined);
      await fs.writeFile(
        file(`${hook}.js`),
        "export default function fixtureHook() {};",
      );
      assert.equal((await startup("present"))[option].name, "fixtureHook");
    });
    it(`${procedure} rejects a present hook with a missing dependency`, async () => {
      await fs.writeFile(
        file(`${hook}.js`),
        "import './missing-dependency.js'; export default function fixtureHook() {};",
      );
      await assert.rejects(startup("broken"), {
        code: "ERR_MODULE_NOT_FOUND",
      });
    });
  }
});
