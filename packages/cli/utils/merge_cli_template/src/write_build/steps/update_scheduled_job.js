import { oneLine } from "common-tags";

export default ({ name, schedule, project }) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
      gcloud beta scheduler jobs update http ${name}
      --schedule="${schedule}"
      --project=${project} || exit 0
      `,
    ],
  };
};
