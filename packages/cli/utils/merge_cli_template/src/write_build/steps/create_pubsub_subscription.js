const { oneLine } = require("common-tags");

module.exports = ({
  service,
  operationHash,
  action,
  domain,
  context,
  envUriSpecifier,
  network,
  project,
  region,
  envNameSpecifier,
  name
}) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
    gcloud beta pubsub subscriptions create ${service}-${context}-${operationHash}
    --topic=did-${action}.${domain}.${service}.${envUriSpecifier}${network}
    --push-endpoint=https://${operationHash}.${region}.${envUriSpecifier}${network}
    --push-auth-service-account=cloud-run-pubsub-invoker@${project}${envNameSpecifier}.iam.gserviceaccount.com
    --project=${project}${envNameSpecifier}
    --labels=service=${service},context=${context},domain=${domain},action=${action},name=${name},hash=${operationHash} || exit 0
    `
    ]
  };
};
