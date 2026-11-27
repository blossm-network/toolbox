import { CloudTasksClient } from "@google-cloud/tasks";

// The account this service runs as, from the platform itself. A deploy-time
// variable could name an account other than the one the revision really runs
// as; this cannot.
const identity = async () => {
  const response = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email",
    { headers: { "Metadata-Flavor": "Google" } },
  );
  if (!response.ok)
    throw new Error("This service's own identity could not be read.");
  return (await response.text()).trim();
};

export default { Client: CloudTasksClient, identity };
