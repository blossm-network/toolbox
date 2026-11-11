import assert from "node:assert/strict";
import crypto from "node:crypto";
import { replace, restore } from "sinon";
import kms from "../index.js";

const pairs = [1, 2].map(() =>
  crypto.generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  }),
);
const message = "offline key identity check";
const signatures = pairs.map((pair) =>
  crypto
    .sign("sha256", Buffer.from(message), pair.privateKey)
    .toString("base64"),
);

describe("KMS verification key identity", () => {
  afterEach(restore);
  for (const field of ["project", "location", "ring", "key", "version"]) {
    it(`keeps ${field} in the public key cache identity`, async () => {
      const config = {
        project: `audit-${field}`,
        ring: "r",
        key: "k",
        location: "global",
        version: "1",
      };
      const next = {
        ...config,
        [field]:
          field === "version"
            ? "2"
            : field === "location"
              ? "us-east1"
              : `${config[field]}-other`,
      };
      const requested = [];
      replace(kms.__client, "getPublicKey", async ({ name }) => {
        requested.push(name);
        return [{ pem: pairs[requested.length - 1].publicKey }];
      });
      assert.equal(
        await kms.verify(config)({ message, signature: signatures[0] }),
        true,
      );
      assert.equal(
        await kms.verify(next)({ message, signature: signatures[1] }),
        true,
      );
      assert.equal(
        await kms.verify(next)({ message, signature: signatures[0] }),
        false,
      );
      assert.equal(requested.length, 2);
      assert.notEqual(requested[0], requested[1]);
    });
  }
  it("retries a failed key retrieval and caches only a successful result", async () => {
    const config = {
      project: "audit-retry",
      location: "global",
      ring: "r",
      key: "k",
      version: "1",
    };
    const failure = new Error("temporary retrieval failure");
    let requests = 0;
    replace(kms.__client, "getPublicKey", async () => {
      if (++requests === 1) throw failure;
      return [{ pem: pairs[0].publicKey }];
    });
    const verify = kms.verify(config);
    await assert.rejects(
      verify({ message, signature: signatures[0] }),
      failure,
    );
    assert.equal(await verify({ message, signature: signatures[0] }), true);
    assert.equal(await verify({ message, signature: signatures[0] }), true);
    assert.equal(requests, 2);
  });
});
