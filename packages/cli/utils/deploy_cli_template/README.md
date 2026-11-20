Deploys a template to cloud build.

The assembled `build.yaml` is submitted with `gcloud beta builds submit`, which
runs synchronously with the caller's terminal attached. Generated builds log
with `CLOUD_LOGGING_ONLY`, and only the beta release track streams those logs,
so the operator needs the `beta` gcloud component and `roles/logging.viewer` on
the target project. A failed or interrupted submission rejects the command, and
the temporary working directory is removed either way.

`--dry-run` submits a test-only build that deploys nothing. Its result is the
test result: see the integration suite notes in `@blossm/merge-cli-template`.
