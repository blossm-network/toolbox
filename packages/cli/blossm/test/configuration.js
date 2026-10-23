import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import yaml from "yaml";

const generator = readFileSync(
  new URL("../../utils/merge_cli_template/index.js", import.meta.url),
  "utf8"
);
const registryFn = generator.slice(
  generator.indexOf("const envBaseContainerRegistry ="),
  generator.indexOf("const envProject =")
);
const selection = generator.slice(
  generator.indexOf("const baseContainerRegistery ="),
  generator.indexOf("const mainContainerName =")
);
const registry = new Function(
  "blossmConfig",
  "env",
  "containerRegistery",
  `${registryFn}${selection}; return baseContainerRegistery;`
);

describe("Starter configuration contracts", () => {
  it("selects configured core registries without an unrelated base flag", () => {
    assert.equal(
      registry(
        { core: { registries: { production: "core-registry" } } },
        "production",
        "local-registry"
      ),
      "core-registry"
    );
    assert.equal(
      registry({}, "production", "local-registry"),
      "local-registry"
    );
  });
  it("offers the Redis host and port fields consumed by the generator", () => {
    const config = yaml.parse(
      readFileSync(
        new URL("../src/init/template_config.yaml", import.meta.url),
        "utf8"
      )
    );
    assert.ok(config.vendors.cache.redis.host);
    assert.ok(config.vendors.cache.redis.port);
    assert.equal(config.vendors.cache.redis.port.production, 6379);
  });
  for (const domain of ["session", "challenge"]) {
    it(`keeps the ${domain} gateway identity aligned with its directory`, () => {
      const config = yaml.parse(
        readFileSync(
          new URL(
            `../src/init/template_services/base/domains/${domain}/command_gateway/blossm.yaml`,
            import.meta.url
          ),
          "utf8"
        )
      );
      assert.equal(config.domain, domain);
    });
  }
});
