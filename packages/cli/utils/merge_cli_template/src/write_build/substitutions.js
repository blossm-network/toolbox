const rootDir = require("@blossm/cli-root-dir");

const envUriSpecifier = env => {
  switch (env) {
    case "sandbox":
    case "staging":
      return `${env}.`;
    default:
      return "";
  }
};

const envNameSpecifier = env => {
  switch (env) {
    case "sandbox":
    case "staging":
      return `-${env}`;
    default:
      return "";
  }
};

module.exports = ({ config, configFn, env }) => {
  const blossmConfig = rootDir.config();
  return {
    _NETWORK: config.network || blossmConfig.network,
    _GCP_PROJECT:
      config["gcp-project"] || blossmConfig.providers.cloud.gcp.project,
    _GCP_REGION:
      config["gcp-region"] || blossmConfig.providers.cloud.gcp.region,
    _GCP_DNS_ZONE:
      config["gcp-dns-zone"] || blossmConfig.providers.cloud.gcp.dnsZone,
    _MEMORY: config.memory || blossmConfig.providers.cloud.gcp.memory,
    ...(config.domain && {
      _DOMAIN: config.domain
    }),
    ...(config.service && {
      _SERVICE: config.service
    }),
    ...(config.context && {
      _CONTEXT: config.context
    }),

    ...(configFn && configFn(config)),

    _NODE_ENV: env,
    _ENV_NAME_SPECIFIER: envNameSpecifier(env),
    _ENV_URI_SPECIFIER: envUriSpecifier(env)
  };
};
