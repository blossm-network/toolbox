const { oneLine } = require("common-tags");

module.exports = ({
  name,
  context,
  domain,
  operationHash,
  operationName,
  eventAction,
  eventDomain,
  eventService,
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
    gcloud beta pubsub subscriptions create ${context}-${procedure}-${operationHash}
    --topic=did-${eventAction}.${eventDomain}.${eventService}
    --push-endpoint=https://${region}-${operationName}-${operationHash}-${computeUrlId}-uc.a.run.app 
    --push-auth-token-audience=https://${region}-${operationName}-${operationHash}-${computeUrlId}-uc.a.run.app 
    --push-auth-service-account=cloud-run-pubsub-invoker@${project}.iam.gserviceaccount.com
    --topic-project=${project}
    --expiration-period=never
    --ack-deadline=30
    --project=${project}
      --labels=${Object.entries({
        procedure,
        hash: operationHash,
        context,
        domain,
        name,
        "event-action": eventAction,
        "event-domain": eventDomain,
        "event-service": eventService,
      }).reduce((string, [key, value]) => (string += `${key}=${value},`), "")}
    `,
    ],
  };
};
