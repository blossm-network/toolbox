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
  return {
    _NETWORK: "sm.network",
    _GCP_PROJECT: "smn-core",
    _GCP_REGION: "us-central1",
    _GCP_DNS_ZONE: "network",
    _MEMORY: "128Mi",
    ...(config.domain && {
      _DOMAIN: config.domain
    }),
    ...(config.service && {
      _SERVICE: config.service
    }),
    ...(config.context && {
      _CONTEXT: config.context
    }),
    ...(config.network && {
      _NETWORK: config.network
    }),
    ...(config["gcp-project"] && {
      _GCP_PROJECT: config
    }),
    ...(config["gcp-region"] && {
      _GCP_REGION: config["gcp-region"]
    }),
    ...(config["gcp-dns-zone"] && {
      _GCP_DNS_ZONE: config["gcp-dns-zone"]
    }),
    ...(config.memory && {
      _MEMORY: config.memory
    }),

    ...(configFn && configFn(config)),

    _NODE_ENV: env,
    _ENV_NAME_SPECIFIER: envNameSpecifier(env),
    _ENV_URI_SPECIFIER: envUriSpecifier(env)
  };
};
