import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const cliDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

// Execute generated entrypoints with explicit transport/platform seams. This
// never launches the CLI, installs dependencies or calls cloud services.
export const load = async (relative, deps = {}) => {
  const source = fs
    .readFileSync(path.join(cliDir, relative), "utf8")
    .replace(/^import\s[\s\S]*?;\s*$/gm, "")
    .replace("export default ", "return ");
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  return new AsyncFunction(...Object.keys(deps), source)(
    ...Object.values(deps)
  );
};
