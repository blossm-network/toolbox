import { oneLine } from "common-tags";

export default ({ name, ring, location, project }) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
    gcloud kms keys create ${name}
    --purpose=asymmetric-signing
    --default-algorithm=ec-sign-p256-sha256
    --keyring=${ring}
    --location=${location}
    --project=${project} || exit 0
    `,
    ],
  };
};
