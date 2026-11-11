import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import yaml from "yaml";

const generator = readFileSync(
  new URL("../../utils/merge_cli_template/index.js", import.meta.url),
  "utf8",
);
const registryFn = generator.slice(
  generator.indexOf("const envBaseContainerRegistry ="),
  generator.indexOf("const envProject ="),
);
const selection = generator.slice(
  generator.indexOf("const baseContainerRegistery ="),
  generator.indexOf("const mainContainerName ="),
);
const registry = new Function(
  "blossmConfig",
  "env",
  "containerRegistery",
  `${registryFn}${selection}; return baseContainerRegistery;`,
);

const readers = new Function(
  `${generator.slice(generator.indexOf("const envRedisHost ="), generator.indexOf("const envPublicKeyUrl ="))}; return { envRedisHost, envRedisPort };`,
)();

const templateConfig = () =>
  yaml.parse(
    readFileSync(
      new URL("../src/init/template_config.yaml", import.meta.url),
      "utf8",
    ),
  );

describe("Starter configuration contracts", () => {
  it("selects configured core registries without an unrelated base flag", () => {
    for (const env of ["production", "sandbox", "staging", "development"]) {
      assert.equal(
        registry(templateConfig(), env, "local-registry"),
        templateConfig().core.registries[env],
      );
      for (const config of [
        {},
        { core: {} },
        { core: { registries: {} } },
        { core: { registries: { [env]: "" } } },
      ])
        assert.equal(registry(config, env, "local-registry"), "local-registry");
    }
  });
  it("offers the Redis host and port fields consumed by the generator", () => {
    const config = templateConfig();
    assert.ok(config.vendors.cache.redis.host);
    assert.equal(config.vendors.cache.redis.port.production, 6379);
    config.vendors.cache.redis.host.production = "redis.example.test";
    const args = { config, env: "production" };
    assert.equal(readers.envRedisHost(args), "redis.example.test");
    assert.equal(readers.envRedisPort(args), 6379);
  });
  for (const domain of ["session", "challenge"]) {
    it(`keeps the ${domain} gateway identity aligned with its directory`, () => {
      const config = yaml.parse(
        readFileSync(
          new URL(
            `../src/init/template_services/base/domains/${domain}/command_gateway/blossm.yaml`,
            import.meta.url,
          ),
          "utf8",
        ),
      );
      assert.equal(config.domain, domain);
      assert.equal(config.service, "core");
      assert.deepEqual(
        config.commands.map(({ name }) => name),
        domain === "challenge"
          ? ["issue", "answer"]
          : ["start", "save", "change-scene", "terminate"],
      );
      for (const command of config.commands) {
        assert.equal(command.network, "$core");
        assert.equal(command.service, "core");
        assert.equal(command.protection, "none");
      }
      if (domain === "challenge")
        assert.equal(config.commands[1].key, "challenge");
    });
  }
});
