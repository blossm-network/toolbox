// Grants one role to one member on one resource. The command is additive, so
// the resource's other bindings are kept and repeating it on a redeploy
// changes nothing. A plain argv step: any failure stops the build. Callers
// pass `--condition=None` in `flags` for the resources whose command has it.
export default ({ group, name, flags = [], member, role, project }) => ({
  name: "gcr.io/cloud-builders/gcloud",
  args: [
    ...group,
    "add-iam-policy-binding",
    name,
    ...flags,
    `--member=serviceAccount:${member}`,
    `--role=${role}`,
    `--project=${project}`,
    "--quiet",
  ],
});
