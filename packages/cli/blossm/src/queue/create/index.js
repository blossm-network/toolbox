const { prompt } = require("inquirer");
const normalize = require("@blossm/normalize-cli");
const roboSay = require("@blossm/robo-say");
const { create: createQueue } = require("@blossm/gcp-queue");
const rootDir = require("@blossm/cli-root-dir");

const envProject = ({ env, config }) => {
  switch (env) {
    case "production":
      return config.vendors.cloud.gcp.projects.production;
    case "sandbox":
      return config.vendors.cloud.gcp.projects.sandbox;
    case "staging":
      return config.vendors.cloud.gcp.projects.staging;
    case "development":
      return config.vendors.cloud.gcp.projects.development;
    default:
      return "";
  }
};

const create = async (input) => {
  const env = input.env;

  const blossmConfig = rootDir.config();
  await createQueue({
    project: envProject({ config: blossmConfig, env }),
    location: "us-central1",
    name: input.name,
  });
  //eslint-disable-next-line no-console
  console.log(roboSay("All done. Your queue has been created."));
};

module.exports = async (args) => {
  const input = await normalize({
    entrypointType: "name",
    args,
    flags: [
      {
        name: "env",
        short: "e",
        type: String,
        choices: ["production", "sandbox", "staging", "development"],
        default: "development",
      },
    ],
  });
  if (!input.env) {
    const { env } = await prompt({
      type: "list",
      choices: ["production", "sandbox", "staging", "development"],
      name: "env",
      message: roboSay(`What environment is this for?`),
    });
    input.env = env;
  }

  create(input);
};
