import { readFileSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import semver from "semver";

export const checkWorkspaces = (root, files) => {
  const manifests = files
    .filter((file) => file === "package.json" || file.endsWith("/package.json"))
    .map((file) => ({
      file,
      ...JSON.parse(readFileSync(join(root, file), "utf8")),
    }));
  const local = new Map(manifests.map((manifest) => [manifest.name, manifest]));
  for (const owner of manifests) {
    const require = createRequire(join(root, owner.file));
    for (const section of [
      "dependencies",
      "devDependencies",
      "optionalDependencies",
      "peerDependencies",
    ]) {
      for (const [name, range] of Object.entries(owner[section] || {})) {
        if (!name.startsWith("@blossm/")) continue;
        const dependency = local.get(name);
        if (!dependency)
          throw new Error(
            `${owner.name}: ${name} has no local workspace source`,
          );
        if (!semver.satisfies(dependency.version, range)) {
          throw new Error(
            `${owner.name}: ${name} ${range} does not include local ${dependency.version}`,
          );
        }
        const actual = realpathSync(require.resolve(`${name}/package.json`));
        const expected = realpathSync(join(root, dependency.file));
        if (actual !== expected)
          throw new Error(
            `${owner.name}: ${name} resolves outside its workspace source`,
          );
      }
    }
  }
};

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const files = execFileSync("git", ["-C", root, "ls-files", "-z"], {
    encoding: "utf8",
  }).split("\0");
  checkWorkspaces(root, files);
}
