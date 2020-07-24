const { oneLine } = require("common-tags");

module.exports = ({ name, location, project }) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
    gcloud kms keyrings create ${name}
    --location=${location}
    --project=${project} || exit 0
    `,
    ],
  };
};
