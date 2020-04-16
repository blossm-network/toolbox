const { oneLine } = require("common-tags");
module.exports = ({ uri }) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
      gcloud beta run domain-mappings update ${uri} 
      --certificate-management=automatic
      `,
    ],
  };
};
