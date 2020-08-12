const { oneLine } = require("common-tags");

module.exports = ({
  name,
  context,
  domain,
  service,
  operationHash,
  operationName,
  storeDomain,
  storeService,
  storeAction,
  procedure,
  computeUrlId,
  project,
  region,
}) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
    gcloud beta pubsub subscriptions create ${name}-${context}-${procedure}-${operationHash}-${storeAction}-${storeDomain}-${storeService}
    --topic=${storeAction}.${storeDomain}.${storeService}
    --push-endpoint=https://${region}-${operationName}-${operationHash}-${computeUrlId}-uc.a.run.app 
    --push-auth-token-audience=https://${region}-${operationName}-${operationHash}-${computeUrlId}-uc.a.run.app 
    --push-auth-service-account=cloud-run-pubsub-invoker@${project}.iam.gserviceaccount.com
    --topic-project=${project}
    --expiration-period=never
    --ack-deadline=60
    --project=${project}
      --labels=${Object.entries({
        procedure,
        hash: operationHash,
        ...(context && { context }),
        ...(domain && { domain }),
        ...(service && { service }),
        name,
        "store-domain": storeDomain,
        "store-service": storeService,
      }).reduce(
        (string, [key, value]) => (string += `${key}=${value},`),
        ""
      )} || exit 0
    `,
    ],
  };
};
