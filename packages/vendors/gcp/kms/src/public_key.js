import kms from "@google-cloud/kms";

export default async ({ key, ring, location, version, project }) => {
  const client = new kms.KeyManagementServiceClient();

  const versionPath = client.cryptoKeyVersionPath(
    project,
    location,
    ring,
    key,
    version
  );

  const [{ pem }] = await client.getPublicKey({
    name: versionPath,
  });

  return pem;
};
