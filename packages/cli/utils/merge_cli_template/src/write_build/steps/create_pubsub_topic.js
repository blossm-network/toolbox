const { oneLine } = require("common-tags");

module.exports = ({
  action,
  domain,
  service,
  envUriSpecifier,
  network,
  project,
  envNameSpecifier
}) => {
  return {
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
    gcloud pubsub topics create did-${action}.${domain}.${service}.${envUriSpecifier}${network} 
    --project=${project}${envNameSpecifier} || exit 0
    `
    ]
  };
};
