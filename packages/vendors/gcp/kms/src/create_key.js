import kms from "@google-cloud/kms";

export default async ({ id, ring, project, location }) => {
  const client = new kms.KeyManagementServiceClient();
  const parent = client.keyRingPath(project, location, ring);
  await client.createCryptoKey({
    parent,
    cryptoKeyId: id,
    cryptoKey: {
      purpose: "ENCRYPT_DECRYPT",
    },
  });
};
