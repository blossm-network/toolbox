import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const file = new URL(
  "../src/write_compose/procedure_services.js",
  import.meta.url,
);
const require = createRequire(file);

export default async (directory, workspace = { network: "example.test" }) => {
  const source = readFileSync(file, "utf8")
    .replace(
      'import rootDir from "@blossm/cli-root-dir";',
      `const rootDir = { path: () => ${JSON.stringify(directory)}, config: () => (${JSON.stringify(workspace)}) };`,
    )
    .replace(
      /from "([^"]+)"/g,
      (_, name) =>
        `from ${JSON.stringify(
          name.startsWith(".")
            ? new URL(name, file).href
            : name === "path"
              ? "node:path"
              : pathToFileURL(require.resolve(name)).href,
        )}`,
    );
  return (
    await import(
      `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
    )
  ).default;
};
