import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { replace, restore, fake } from "sinon";
import secret from "../index.js";
import deps from "../deps.js";

describe("Secret native filesystem ownership", () => {
  let directory;
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "blossm-secret-"));
    const uuid = deps.uuid;
    replace(deps, "uuid", () => join(directory, uuid()));
  });
  afterEach(async () => {
    restore();
    await rm(directory, { recursive: true, force: true });
  });

  it("uploads each same-key ciphertext from its own real file and removes both", async () => {
    replace(deps, "createKey", fake.resolves());
    replace(deps, "encrypt", async ({ message }) => `cipher:${message}`);
    let arrived = 0;
    let release;
    const ready = new Promise((resolve) => {
      release = resolve;
    });
    const uploaded = new Map();
    const paths = new Set();
    replace(deps, "upload", async ({ bucket, file, destination }) => {
      paths.add(file);
      if (++arrived === 2) release();
      await ready;
      assert.equal(destination, "same-key.txt.encrypted");
      uploaded.set(bucket, await readFile(file, "utf8"));
    });
    await Promise.all([
      secret.create("same-key", "A", { bucket: "bucket-A" }),
      secret.create("same-key", "B", { bucket: "bucket-B" }),
    ]);
    assert.equal(paths.size, 2);
    assert.equal(uploaded.get("bucket-A"), "cipher:A");
    assert.equal(uploaded.get("bucket-B"), "cipher:B");
    assert.deepEqual(await readdir(directory), []);
  });

  it("removes a real partial download and preserves its failure", async () => {
    const failure = new Error("download interrupted");
    replace(deps, "download", async ({ destination }) => {
      await writeFile(destination, "partial ciphertext");
      throw failure;
    });
    const decrypt = fake();
    replace(deps, "decrypt", decrypt);
    await assert.rejects(secret.get("fixture"), (error) => error === failure);
    assert.equal(decrypt.callCount, 0);
    assert.deepEqual(await readdir(directory), []);
  });
});

describe("Secret cleanup failure precedence", () => {
  afterEach(restore);
  for (const code of ["ENOENT", "EACCES"]) {
    it(`ignores only ENOENT after successful processing (${code})`, async () => {
      replace(deps, "download", fake.resolves());
      replace(deps, "readFile", fake.resolves(Buffer.from("cipher")));
      replace(deps, "decrypt", fake.resolves("fixture-secret"));
      const error = Object.assign(new Error("cleanup"), { code });
      replace(deps, "unlink", fake.rejects(error));
      if (code === "ENOENT")
        assert.equal(await secret.get("fixture"), "fixture-secret");
      else
        await assert.rejects(
          secret.get("fixture"),
          (result) => result === error,
        );
    });
  }
  it("preserves even a falsy primary rejection when cleanup also fails", async () => {
    replace(deps, "download", async () => {
      throw undefined;
    });
    const cleanup = fake.rejects(new Error("cleanup failed"));
    replace(deps, "unlink", cleanup);
    await secret.get("fixture").then(
      () => assert.fail("expected rejection"),
      (error) => assert.equal(error, undefined),
    );
    assert.equal(cleanup.callCount, 1);
  });
});
