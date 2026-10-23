import assert from "assert";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { pathToFileURL } from "url";
import optionalImport from "../../utils/merge_cli_template/template/optional_import.js";

describe("Generated optional hook imports", () => {
  let directory;
  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), "blossm-hook-"));
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
});
