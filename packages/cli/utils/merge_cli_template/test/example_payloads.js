import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { examplePayloads } from "../src/resolve_transient_info.js";

describe("Gateway example payloads", () => {
  let dir;
  const command = (name, domain, testing) => {
    const path = join(dir, domain, "commands", name);
    mkdirSync(path, { recursive: true });
    writeFileSync(
      join(path, "blossm.yaml"),
      JSON.stringify({
        name,
        domain,
        service: "core",
        procedure: "command",
        testing,
      }),
    );
  };
  before(() => {
    dir = mkdtempSync(join(tmpdir(), "blossm-examples-"));
    command("start", "session", {
      validate: { ok: [{ device: "first" }, { device: "second" }] },
    });
    command("save", "session", {});
    command("start", "account", { validate: { ok: [{ other: true }] } });
  });
  after(() => rmSync(dir, { recursive: true }));

  it("takes the first valid payload of each of the gateway's own commands", () => {
    assert.deepEqual(
      examplePayloads(
        {
          domain: "session",
          service: "core",
          commands: [
            { name: "start" },
            { name: "save" },
            { name: "missing" },
            { name: "elsewhere", network: "other.network" },
          ],
        },
        dir,
      ),
      { start: { device: "first" } },
    );
  });
});
