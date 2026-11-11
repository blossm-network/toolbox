import assert from "node:assert/strict";
import { Storage } from "@google-cloud/storage";

describe("Installed Storage resource contract", () => {
  it("keeps the bucket and file references used by upload and download", () => {
    const storage = new Storage({ projectId: "offline" });
    const bucket = storage.bucket("fixture");
    const file = bucket.file("directory/file.txt");
    assert.equal(bucket.name, "fixture");
    assert.equal(file.name, "directory/file.txt");
    assert.equal(file.bucket, bucket);
    for (const method of ["upload", "getFiles"])
      assert.equal(typeof bucket[method], "function");
    assert.equal(typeof file.download, "function");
  });
});
