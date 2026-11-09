import assert from "node:assert/strict";
import { replace, restore, fake } from "sinon";
import secret from "../index.js";
import deps from "../deps.js";

describe("Secret file ownership and recovery", () => {
  afterEach(restore);
  it("keeps concurrent same-key writes in separate local files", async () => {
    let sequence = 0;
    let writes = 0;
    let release;
    const bothWritten = new Promise((resolve) => {
      release = resolve;
    });
    const files = new Map();
    const uploaded = new Map();
    replace(deps, "uuid", () => `temp-${sequence++}`);
    replace(deps, "createKey", fake.resolves());
    replace(deps, "encrypt", async ({ message }) => `ciphertext:${message}`);
    replace(deps, "writeFile", async (file, bytes) => {
      files.set(file, bytes);
      if (++writes === 2) release();
      await bothWritten;
    });
    replace(deps, "upload", async ({ file, bucket, destination }) => {
      uploaded.set(`${bucket}/${destination}`, files.get(file));
    });
    replace(deps, "unlink", async (file) => {
      assert.ok(files.delete(file));
    });
    await Promise.all([
      secret.create("same-key", "A", { bucket: "bucket-A" }),
      secret.create("same-key", "B", { bucket: "bucket-B" }),
    ]);
    assert.equal(
      uploaded.get("bucket-A/same-key.txt.encrypted"),
      "ciphertext:A"
    );
    assert.equal(
      uploaded.get("bucket-B/same-key.txt.encrypted"),
      "ciphertext:B"
    );
    assert.equal(files.size, 0);
  });
  it("cleans up failed uploads without masking the upload error", async () => {
    const failure = new Error("upload failed");
    const cleanup = fake.rejects(new Error("cleanup also failed"));
    replace(deps, "createKey", fake.resolves());
    replace(deps, "encrypt", fake.resolves("cipher"));
    replace(deps, "writeFile", fake.resolves());
    replace(deps, "upload", fake.rejects(failure));
    replace(deps, "unlink", cleanup);
    await assert.rejects(
      secret.create("key", "dummy"),
      (error) => error === failure
    );
    assert.equal(cleanup.callCount, 1);
  });
  it("cleans up after read failures", async () => {
    const failure = new Error("read failed");
    const cleanup = fake.resolves();
    replace(deps, "download", fake.resolves());
    replace(deps, "readFile", fake.rejects(failure));
    replace(deps, "unlink", cleanup);
    await assert.rejects(secret.get("key"), (error) => error === failure);
    assert.equal(cleanup.callCount, 1);
  });
  it("surfaces KMS permission failures instead of treating them as existing keys", async () => {
    const failure = Object.assign(new Error("permission denied"), { code: 7 });
    replace(deps, "createKey", fake.rejects(failure));
    const encrypt = fake.resolves("cipher");
    replace(deps, "encrypt", encrypt);
    replace(deps, "writeFile", fake.resolves());
    replace(deps, "upload", fake.resolves());
    replace(deps, "unlink", fake.resolves());
    await assert.rejects(
      secret.create("key", "dummy"),
      (error) => error === failure
    );
    assert.equal(encrypt.callCount, 0);
  });
});
