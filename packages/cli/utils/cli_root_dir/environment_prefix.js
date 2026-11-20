// Owns the hostname prefix of each environment. A workspace may replace the
// historical abbreviations with `environmentPrefixes` in config.yaml.
const defaults = { sandbox: "snd.", staging: "stg.", development: "dev." };

export default (env, config) => {
  const prefix = config?.environmentPrefixes?.[env] ?? defaults[env] ?? "";
  if (
    typeof prefix != "string" ||
    !/^(([a-z0-9]([a-z0-9-]*[a-z0-9])?)\.)*$/.test(prefix)
  )
    throw new Error(
      `environmentPrefixes.${env} must be empty or DNS labels ending with a dot.`
    );
  return prefix;
};
