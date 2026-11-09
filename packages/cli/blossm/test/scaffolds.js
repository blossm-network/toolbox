import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { spawnSync } from "child_process";

const require = createRequire(import.meta.url);
const sourceDir = fileURLToPath(new URL("../src/", import.meta.url));
const mocha = require.resolve("mocha/bin/mocha.js");
const modules = path.dirname(
  path.dirname(require.resolve("chai/package.json"))
);

const runFixture = ({ source, enabled = false, count }) => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "blossm-scaffold-"));
  try {
    fs.cpSync(path.join(sourceDir, source), fixture, { recursive: true });
    fs.writeFileSync(path.join(fixture, "package.json"), '{"type":"module"}');
    fs.symlinkSync(modules, path.join(fixture, "node_modules"), "dir");
    // The fact's test must replace this seam before its sample RPC executes.
    if (source === "fact/init/template") {
      fs.writeFileSync(
        path.join(fixture, "deps.js"),
        'export default { eventStore: () => { throw new Error("unstubbed RPC"); }, gcpToken: () => { throw new Error("unstubbed cloud token"); } };'
      );
    }
    if (enabled) {
      for (const file of fs.readdirSync(fixture)) {
        if (file.startsWith("_") && file.endsWith(".js")) {
          fs.renameSync(
            path.join(fixture, file),
            path.join(fixture, file.slice(1))
          );
        }
      }
    }
    const result = spawnSync(
      process.execPath,
      [mocha, "--recursive", "test/unit", "--reporter", "json"],
      { cwd: fixture, encoding: "utf8", timeout: 20000 }
    );
    assert.strictEqual(
      result.status,
      0,
      `${source}: ${result.stdout}\n${result.stderr}`
    );
    const output = result.stdout.slice(result.stdout.indexOf('{\n  "stats"'));
    const report = JSON.parse(output);
    assert.strictEqual(
      report.stats.tests,
      count,
      `${source}: offered scaffold checks must execute`
    );
    assert.strictEqual(report.stats.passes, count, source);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
};

describe("Generated scaffold test contracts", function () {
  this.timeout(30000);
  for (const procedure of ["command", "fact", "view_composite", "job"]) {
    it(`runs the ${procedure} scaffold without external effects`, () =>
      runFixture({ source: `${procedure}/init/template`, count: 1 }));
  }
  it("runs both root generation branches in the starter command", () =>
    runFixture({
      source: "init/template_services/animals/domains/bird/commands/chirp",
      count: 2,
    }));
  for (const [source, count] of [
    ["view_store/init/template", 6],
    ["init/template_views/stores/dashboard/view_store", 5],
    ["command_gateway/init/template", 1],
    ["fact_gateway/init/template", 1],
  ]) {
    it(`runs enabled optional hooks in ${source}`, () =>
      runFixture({ source, enabled: true, count }));
    it(`omits disabled optional hooks in ${source}`, () =>
      runFixture({ source, count: 0 }));
  }
});
