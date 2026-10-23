import assert from "node:assert/strict";
import kms, { __client } from "../index.js";

describe("KMS lazy client", () => {
  it("preserves the shared exported client identity", () => {
    assert.equal(kms.__client, __client);
  });
});
