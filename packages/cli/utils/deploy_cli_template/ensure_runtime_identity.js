import fs from "fs";
import path from "path";
import yaml from "yaml";

// Creates the runtime identity a deployment names when it does not exist yet,
// and lets the build identity deploy as it. This runs as the person deploying,
// who would otherwise run the same two commands by hand, so the build identity
// needs no authority over service accounts. An existing identity is left
// exactly as it is.
export default ({ workingDir, project, execFileSync }) => {
  const build = yaml.parse(
    fs.readFileSync(path.resolve(workingDir, "build.yaml"), "utf8"),
  );
  const prefix = "--service-account=";
  const runtime = build.steps
    .flatMap((step) => step.args || [])
    .find((arg) => typeof arg == "string" && arg.startsWith(prefix))
    ?.slice(prefix.length);
  const suffix = `@${project}.iam.gserviceaccount.com`;
  // Dry runs deploy nothing, and another project's identity is not ours to make.
  if (!runtime || !runtime.endsWith(suffix)) return;

  const gcloud = (...args) =>
    execFileSync(
      "gcloud",
      ["iam", "service-accounts", ...args, `--project=${project}`],
      { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
    );
  try {
    gcloud("describe", runtime);
    return;
  } catch (e) {
    // Anything but a clear absence, such as no permission to look, is left
    // for the build to report.
    if (!/NOT_FOUND/.test(`${e.stderr}`)) return;
  }
  gcloud("create", runtime.slice(0, -suffix.length), "--quiet");
  const buildIdentity = build.serviceAccount?.split("/").pop();
  if (buildIdentity)
    gcloud(
      "add-iam-policy-binding",
      runtime,
      `--member=serviceAccount:${buildIdentity}`,
      "--role=roles/iam.serviceAccountUser",
      "--condition=None",
      "--quiet",
    );
  return runtime;
};
