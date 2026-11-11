// Read before creating so an existing resource is reusable without hiding a
// failed write. All resource values remain argv data, never shell source.
// Double dollars survive Cloud Build substitution before Bash receives them.
export default ({ describe, create, update = [] }) => ({
  name: "gcr.io/cloud-builders/gcloud",
  entrypoint: "bash",
  args: [
    "-c",
    `if gcloud "$\${@:1:${describe.length}}" >/dev/null 2>&1; then
      ${
        update.length
          ? `exec gcloud "$\${@:${describe.length + create.length + 1}}"`
          : "exit 0"
      }
    else
      exec gcloud "$\${@:${describe.length + 1}:${create.length}}"
    fi`,
    "--",
    ...describe,
    ...create,
    ...update,
  ],
});
