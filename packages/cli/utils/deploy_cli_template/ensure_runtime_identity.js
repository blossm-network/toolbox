import fs from "fs";
import path from "path";
import yaml from "yaml";

// Creates the runtime identity a deployment names when it does not exist yet,
// and lets the build identity deploy as it. This runs as the person deploying,
// who would otherwise run the same two commands by hand, so the build identity
// needs no authority over service accounts.
//
// A service that queues tasks delivers them as itself, which it may only do
// with leave to act as itself. That is granted here too, to a new identity
// and to an existing one, and only to a service whose build lets it queue.
// Nothing else about an existing identity is touched.
export default ({ workingDir, project, execFileSync }) => {
  const build = yaml.parse(
    fs.readFileSync(path.resolve(workingDir, "build.yaml"), "utf8"),
  );
  const prefix = "--service-account=";
  const args = build.steps.flatMap((step) => step.args || []);
  const named = args
    .find((arg) => typeof arg == "string" && arg.startsWith(prefix))
    ?.slice(prefix.length);
  const suffix = `@${project}.iam.gserviceaccount.com`;
  // Another project's identity is not ours to make.
  if (named && !named.endsWith(suffix)) return;
  // The build grants this role on a queue only to a service that queues.
  const queues = args.includes("--role=roles/cloudtasks.enqueuer");
  // A dry run deploys nothing.
  if (!named && !queues) return;

  const run = (...args) =>
    execFileSync("gcloud", args, {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    });
  const gcloud = (...args) =>
    run("iam", "service-accounts", ...args, `--project=${project}`);
  // With no identity named, the service runs as the project's default one.
  const runtime =
    named ??
    `${run(
      "projects",
      "describe",
      project,
      "--format=value(projectNumber)",
    ).trim()}-compute@developer.gserviceaccount.com`;
  const actAs = (member) => [
    "add-iam-policy-binding",
    runtime,
    `--member=serviceAccount:${member}`,
    "--role=roles/iam.serviceAccountUser",
    "--condition=None",
    "--quiet",
  ];
  let created;
  if (named)
    try {
      gcloud("describe", runtime);
    } catch (e) {
      // Anything but a clear absence, such as no permission to look, is
      // left for the build to report: it deploys as this identity.
      if (/NOT_FOUND/.test(`${e.stderr}`)) {
        gcloud("create", runtime.slice(0, -suffix.length), "--quiet");
        const buildIdentity = build.serviceAccount?.split("/").pop();
        if (buildIdentity) gcloud(...actAs(buildIdentity));
        created = runtime;
      }
    }
  // Already in place on a redeploy, which then needs no authority over the
  // account. Not being able to tell counts as not in place.
  const actsAsItself = () => {
    try {
      return JSON.parse(
        gcloud("get-iam-policy", runtime, "--format=json"),
      ).bindings.some(
        ({ role, members, condition }) =>
          role == "roles/iam.serviceAccountUser" &&
          !condition &&
          members.includes(`serviceAccount:${runtime}`),
      );
    } catch {
      return false;
    }
  };
  if (queues && !actsAsItself())
    try {
      gcloud(...actAs(runtime));
    } catch (e) {
      // Deploying anyway would give a service whose every task is refused.
      throw new Error(
        `${runtime} queues tasks as itself and needs roles/iam.serviceAccountUser on itself. It could not be confirmed (iam.serviceAccounts.getIamPolicy) or granted (setIamPolicy): ${`${e.stderr || e.message}`.trim()}`,
        { cause: e },
      );
    }
  return created;
};
