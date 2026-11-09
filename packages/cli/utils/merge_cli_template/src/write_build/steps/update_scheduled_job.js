export default ({ name, schedule, project, region }) => ({
  name: "gcr.io/cloud-builders/gcloud",
  entrypoint: "gcloud",
  args: [
    "scheduler",
    "jobs",
    "update",
    "http",
    name,
    `--schedule=${schedule}`,
    `--project=${project}`,
    `--location=${region}`,
    "--quiet",
  ],
});
