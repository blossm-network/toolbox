// Read before creating so an existing resource is reusable without hiding a
// failed write. All resource values remain argv data, never shell source.
// Double dollars survive Cloud Build substitution before Bash receives them.
export default ({ describe, create, update = [], expected }) => ({
  name: "gcr.io/cloud-builders/gcloud",
  entrypoint: "bash",
  args: [
    "-c",
    `if actual=$$(gcloud "$\${@:1:${describe.length}}" 2>/dev/null); then
      ${
        expected === undefined
          ? ""
          : `if [ "$$actual" != "$\${${
              describe.length + create.length + update.length + 1
            }}" ]; then
        echo "Existing resource target differs; refusing to replace it." >&2
        exit 1
      fi`
      }
      ${
        update.length
          ? `exec gcloud "$\${@:${describe.length + create.length + 1}:${
              update.length
            }}"`
          : "exit 0"
      }
    else
      exec gcloud "$\${@:${describe.length + 1}:${create.length}}"
    fi`,
    "--",
    ...describe,
    ...create,
    ...update,
    ...(expected === undefined ? [] : [expected]),
  ],
});
