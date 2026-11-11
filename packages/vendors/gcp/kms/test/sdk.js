import assert from "node:assert/strict";
import { KeyManagementServiceClient, protos } from "@google-cloud/kms";

describe("Installed KMS resource and encryption request contract", () => {
  it("keeps resource paths and binary request payloads", async () => {
    const client = new KeyManagementServiceClient({ projectId: "offline" });
    try {
      const name = client.cryptoKeyPath("offline", "global", "ring", "key");
      assert.equal(
        name,
        "projects/offline/locations/global/keyRings/ring/cryptoKeys/key",
      );
      assert.equal(
        client.cryptoKeyVersionPath("offline", "global", "ring", "key", "2"),
        `${name}/cryptoKeyVersions/2`,
      );
      const { EncryptRequest } = protos.google.cloud.kms.v1;
      const request = { name, plaintext: Buffer.from("offline 🌱") };
      assert.equal(EncryptRequest.verify(request), null);
      const decoded = EncryptRequest.decode(
        EncryptRequest.encode(request).finish(),
      );
      assert.equal(decoded.name, name);
      assert.equal(decoded.plaintext.toString(), "offline 🌱");
    } finally {
      await client.close();
    }
  });
});
