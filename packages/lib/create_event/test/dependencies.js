import assert from "node:assert/strict";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

describe("Create-event consumer dependencies", () => {
  it("loads and creates an event with only its declared runtime dependencies", async () => {
    const consumer = await mkdtemp(
      join(tmpdir(), "blossm-create-event-consumer-")
    );
    try {
      const manifest = JSON.parse(
        await readFile(new URL("../package.json", import.meta.url), "utf8")
      );
      for (const name of ["index.js", "deps.js", "package.json"])
        await copyFile(
          new URL(`../${name}`, import.meta.url),
          join(consumer, name)
        );
      for (const name of Object.keys(manifest.dependencies)) {
        const destination = join(consumer, "node_modules", name);
        await mkdir(dirname(destination), { recursive: true });
        await symlink(
          await realpath(dirname(require.resolve(`${name}/package.json`))),
          destination,
          "dir"
        );
      }
      const { default: createEvent } = await import(
        pathToFileURL(join(consumer, "index.js"))
      );
      const event = createEvent({
        root: "root",
        action: "created",
        domain: "account",
        service: "core",
        payload: {},
      });
      assert.equal(event.headers.root, "root");
      assert.equal(Number.isNaN(Date.parse(event.headers.created)), false);
    } finally {
      await rm(consumer, { recursive: true, force: true });
    }
  });
});
