const { prompt } = require("inquirer");
const normalize = require("@blossm/normalize-cli");
const roboSay = require("@blossm/robo-say");
const { upload: uploadFile } = require("@blossm/gcp-storage");
const rootDir = require("@blossm/cli-root-dir");

const envRolesBucket = ({ env, config }) => {
  switch (env) {
    case "production":
      return config.vendors.cloud.gcp.rolesBuckets.production;
    case "sandbox":
      return config.vendors.cloud.gcp.rolesBuckets.sandbox;
    case "staging":
      return config.vendors.cloud.gcp.rolesBuckets.staging;
    case "development":
      return config.vendors.cloud.gcp.rolesBuckets.development;
    default:
      return "";
  }
};

const upload = async input => {
  const env = input.env;

  const blossmConfig = rootDir.config();

  await uploadFile({
    bucket: envRolesBucket({ config: blossmConfig, env }),
    file: input.path,
    destination: "roles.yaml"
  });
};

module.exports = async args => {
  const input = await normalize({
    entrypointType: "path",
    entrypointDefault: "roles.yaml",
    args,
    flags: [
      {
        name: "env",
        short: "e",
        type: String,
        choices: ["production", "sandbox", "staging", "development"],
        default: "development"
      }
    ]
  });
  if (!input.env) {
    const { env } = await prompt({
      type: "list",
      choices: ["production", "sandbox", "staging", "development"],
      name: "env",
      message: roboSay(`What environment is this for?`)
    });
    input.env = env;
  }

  upload(input);
};
