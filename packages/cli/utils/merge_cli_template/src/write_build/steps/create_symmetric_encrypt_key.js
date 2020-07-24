const { oneLine } = require("common-tags");

module.exports = ({ name, ring, project, rotation }) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
    gcloud kms key create ${name}
    --purpose=encryption
    --keyring=${ring}
    --location=global
    --rotation-period=${rotation}
    --project=${project} || exit 0
    `,
    ],
  };
};
