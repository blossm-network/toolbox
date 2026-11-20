import { nodeImage } from "../../../runtime.js";

// Owns how a test-only (dry) build reports its integration suites. A strict
// build runs each suite directly, so a failure stops the build before any
// deploy step. A dry build still has to reach the container logs, so each suite
// records its exit status in a reserved workspace file and the final log step
// rejects every expected suite whose recorded status is not exactly 0.
//
// Both scripts use shell builtins only, so they depend on nothing in either
// image beyond the shell itself.
export const scripts = {
  base: "test:base-integration",
  custom: "test:integration",
};

const statusFile = (script) => `.blossm-dry-run-status-${script}`;

// Cloud Build substitutes dollars in step args before the shell receives them,
// and turns a doubled dollar into a literal one. The shell below is written as
// the shell should see it and escaped here, once, on its way into args.
const escaped = (shell) => shell.replaceAll("$", () => "$$");

export const suite = ({ script, strict = true }) => ({
  name: nodeImage,
  entrypoint: strict ? "yarn" : "bash",
  args: strict
    ? [script]
    : [
        "-c",
        // The step succeeds only once the status is recorded.
        escaped(`yarn ${script}\necho "$?" > "${statusFile(script)}"`),
      ],
});

export const logsThenVerdict = (expected) =>
  escaped(
    [
      "docker compose logs",
      "logs=$?",
      "failed=0",
      ...expected.flatMap((script) => [
        // An absent, unreadable or empty record stays a failure.
        "status=missing",
        `{ read -r status < "${statusFile(script)}"; } 2>/dev/null`,
        `[ "$status" = 0 ] || { echo "Dry run failed: ${script} status: $status" >&2; failed=1; }`,
      ]),
      '[ "$failed" = 0 ] || exit 1',
      'exit "$logs"',
    ].join("\n"),
  );
