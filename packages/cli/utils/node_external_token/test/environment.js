import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import environmentName from "../environment_name.js";

const runtimeFile = new URL("../index.js", import.meta.url);
const generatorFile = new URL(
  "../../merge_cli_template/index.js",
  import.meta.url
);

describe("Dependency credential environment names", () => {
  it("uses every configured network label without aliasing peer subdomains", async () => {
    const networks = [
      "example.network",
      "api.example.network",
      "stg.api.example.network",
      "other.example.network",
    ];
    const config = {
      dependencies: Object.fromEntries(
        networks.map((network) => [
          network,
          {
            keys: {
              testing: {
                root: `${network}-root`,
                secretName: `${network}-secret`,
              },
            },
          },
        ])
      ),
    };
    const generatorSource = readFileSync(generatorFile, "utf8");
    const fn = generatorSource.slice(
      generatorSource.indexOf("const envDependencyKeyEnvironmentVariables ="),
      generatorSource.indexOf("const envBaseContainerRegistry")
    );
    const env = new Function(
      "environmentName",
      `${fn}; return envDependencyKeyEnvironmentVariables;`
    )(environmentName)({ env: "testing", config });
    const prior = { ...process.env };
    Object.assign(process.env, env);
    try {
      const source = readFileSync(runtimeFile, "utf8")
        .replace(
          'import gcpSecret from "@blossm/gcp-secret";',
          "const gcpSecret = { get: async name => name };"
        )
        .replace(
          'import connectionToken from "@blossm/connection-token";',
          "const connectionToken = options => options;"
        )
        .replace(
          /from "(\.\/[^"]+)"/g,
          (_, name) => `from ${JSON.stringify(new URL(name, runtimeFile).href)}`
        );
      const { credentialsFn } = (
        await import(
          `data:text/javascript;base64,${Buffer.from(source).toString(
            "base64"
          )}`
        )
      ).default;
      for (const network of networks)
        assert.deepEqual(await credentialsFn({ network }), {
          root: `${network}-root`,
          secret: `${network}-secret`,
        });
    } finally {
      for (const key of Object.keys(env)) {
        if (prior[key] === undefined) delete process.env[key];
        else process.env[key] = prior[key];
      }
    }
  });
});
