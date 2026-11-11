import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import environmentName from "../environment_name.js";

const runtimeFile = new URL("../index.js", import.meta.url);
const generatorFile = new URL(
  "../../merge_cli_template/index.js",
  import.meta.url,
);
const connectionFile = new URL(
  "../../../../lib/connection_token/index.js",
  import.meta.url,
);
const execute = (source, deps, declaration = "export default ") =>
  new Function(
    ...Object.keys(deps),
    source
      .replace(/^import\s[\s\S]*?;\s*$/gm, "")
      .replace(declaration, "return "),
  )(...Object.values(deps));

describe("Dependency credential environment names", () => {
  it("composes full-network generation and lookup through the connection-token factory", async () => {
    // Load the real generator too, proving its declared helper subpath resolves.
    await import(generatorFile);
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
        ]),
      ),
    };
    const source = readFileSync(generatorFile, "utf8");
    const generator = source.slice(
      source.indexOf("const envDependencyKeyEnvironmentVariables ="),
      source.indexOf("const envBaseContainerRegistry"),
    );
    const env = new Function(
      "environmentName",
      `${generator}; return envDependencyKeyEnvironmentVariables;`,
    )(environmentName)({ env: "testing", config });
    const reads = [];
    const exchanges = [];
    const cache = new Map();
    const connectionToken = execute(readFileSync(connectionFile, "utf8"), {
      deps: {
        redis: {
          readObject: async (key) => cache.get(key),
          writeObject: async (key, value) => cache.set(key, value),
          setExpiry: async () => {},
        },
        basicToken: (credentials) => credentials,
        decode: () => ({ claims: { exp: "2100-01-01T00:00:00Z" } }),
        command: ({ network }) => ({
          set: ({ token }) => ({
            issue: async () => {
              exchanges.push({ network, credentials: token.externalFn() });
              return { body: { token: { value: `${network}-token` } } };
            },
          }),
        }),
      },
    });
    const tokenFor = execute(readFileSync(runtimeFile, "utf8"), {
      gcpSecret: {
        get: async (name) => {
          reads.push(name);
          return name;
        },
      },
      connectionToken,
      environmentName,
      process: { env },
    });
    for (const network of networks) {
      assert.deepEqual(await tokenFor({ network }), {
        token: `${network}-token`,
        type: "Bearer",
      });
      assert.deepEqual(exchanges.at(-1), {
        network,
        credentials: { root: `${network}-root`, secret: `${network}-secret` },
      });
    }
    assert.deepEqual(
      reads,
      networks.map((network) => `${network}-secret`),
    );
    assert.equal(cache.size, networks.length);
    assert.equal(
      await tokenFor({ network: "unconfigured.example.network" }),
      null,
    );
    assert.equal(
      reads.length,
      networks.length,
      "unknown subdomain must not use base credentials",
    );
    assert.equal(exchanges.length, networks.length);
  });
});
