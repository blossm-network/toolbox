import { oneLine } from "common-tags";

export default ({ name, ring, project, next, rotation }) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
    gcloud kms keys create ${name}
    --purpose=encryption
    --keyring=${ring}
    --location=global
    --rotation-period=${rotation}
    --next-rotation-time=${next}
    --project=${project} || exit 0
    `,
    ],
  };
};
