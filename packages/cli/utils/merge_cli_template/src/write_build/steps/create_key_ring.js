import { oneLine } from "common-tags";

export default ({ name, location, project }) => {
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
