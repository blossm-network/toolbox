import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  nodeVersion,
  nodeImage,
  nodeSlimImage,
} from "../packages/cli/utils/merge_cli_template/runtime.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const write = process.argv.includes("--write");
const files = execFileSync("git", ["-C", root, "ls-files", "-z"], {
  encoding: "utf8",
}).split("\0");
const update = (file, expected) => {
  const current = readFileSync(root + file, "utf8");
  if (current === expected) return;
  if (!write)
    throw new Error(
      `${file} differs from the runtime owner. Run yarn runtime:sync.`,
    );
  writeFileSync(root + file, expected);
};

update(".nvmrc", `${nodeVersion}\n`);
for (const file of files.filter(
  (file) => file === "package.json" || file.endsWith("/package.json"),
)) {
  const content = readFileSync(root + file, "utf8");
  const manifest = JSON.parse(content);
  if (!manifest.engines) continue;
  // Generated copies of the runtime policy stay checked, including packed templates.
  update(
    file,
    content.replace(/"node": "[^"]*"/, `"node": ">= ${nodeVersion}"`),
  );
}
update(
  "build.yaml",
  readFileSync(root + "build.yaml", "utf8").replace(
    /_NODE_IMAGE: node:[^\s]+/,
    `_NODE_IMAGE: ${nodeImage}`,
  ),
);
for (const file of [
  "packages/cli/utils/merge_cli_template/template/Dockerfile",
  "packages/cli/utils/merge_cli_template/template/http_dependency/Dockerfile",
]) {
  update(
    file,
    readFileSync(root + file, "utf8").replace(
      /^FROM node:[^\s]+/m,
      `FROM ${nodeSlimImage}`,
    ),
  );
}
