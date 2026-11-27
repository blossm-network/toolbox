// Read before creating so an existing resource is reusable without hiding a
// failed write. All resource values remain argv data, never shell source.
// An expected projection permits exact-target reuse, never silent retargeting.
// Double dollars survive Cloud Build substitution before Bash receives them.
// `emptyIsMissing` is for a read that succeeds with nothing to show, such as a
// list of members: no output then means the resource is still to be created.
// `has` is for a read that lists names joined by semicolons, gcloud's value
// format for a list: the resource exists only if that name is among them.
export default ({
  describe,
  create,
  update = [],
  expected,
  emptyIsMissing = false,
  has,
}) => ({
  name: "gcr.io/cloud-builders/gcloud",
  entrypoint: "bash",
  args: [
    "-c",
    `if actual=$$(gcloud "$\${@:1:${describe.length}}" 2>/dev/null)${
      emptyIsMissing ? ' && [ -n "$$actual" ]' : ""
    }${
      has === undefined
        ? ""
        : ` && [[ ";$$actual;" == *";$\${${
            describe.length + create.length + update.length + 1
          }};"* ]]`
    }; then
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
    // One trailing value at most: a target to equal, or a name to find.
    ...(expected === undefined ? [] : [expected]),
    ...(has === undefined ? [] : [has]),
  ],
});
