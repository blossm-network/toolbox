import ensureResource from "./ensure_resource.js";

export default ({
  name,
  context,
  domain,
  service,
  operationHash,
  serviceName,
  storeDomain,
  storeService,
  storeAction,
  procedure,
  computeUrlId,
  project,
  region,
}) => {
  const subscription = `${name}${
    context ? `-${context}` : ""
  }-${procedure}-${operationHash}-${storeAction}.${storeDomain}.${storeService}`;
  return ensureResource({
    describe: [
      "pubsub",
      "subscriptions",
      "describe",
      subscription,
      `--project=${project}`,
    ],
    create: [
      "pubsub",
      "subscriptions",
      "create",
      subscription,
      `--topic=${storeAction}.${storeDomain}.${storeService}`,
      `--push-endpoint=https://${serviceName}-${computeUrlId}.${region}.run.app`,
      `--push-auth-token-audience=https://${serviceName}-${computeUrlId}.${region}.run.app`,
      `--push-auth-service-account=cloud-run-pubsub-invoker@${project}.iam.gserviceaccount.com`,
      `--topic-project=${project}`,
      "--expiration-period=never",
      "--ack-deadline=60",
      `--project=${project}`,
      `--labels=${Object.entries({
        procedure,
        hash: operationHash,
        ...(context && { context }),
        ...(domain && { domain }),
        ...(service && { service }),
        name,
        "store-domain": storeDomain,
        "store-service": storeService,
      })
        .map(([key, value]) => `${key}=${value}`)
        .join(",")}`,
      "--quiet",
    ],
  });
};
