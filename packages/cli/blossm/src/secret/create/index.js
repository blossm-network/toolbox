import inquirer from "inquirer";
import normalize from "@blossm/normalize-cli";
import roboSay from "@blossm/robo-say";
import { create as createSecret } from "@blossm/gcp-secret";
import rootDir from "@blossm/cli-root-dir";
import fs from "fs";
import path from "path";

const { prompt } = inquirer;

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

const envSecretsBucket = ({ env, config }) => {
  switch (env) {
    case "production":
      return config.vendors.cloud.gcp.secretsBuckets.production;
    case "sandbox":
      return config.vendors.cloud.gcp.secretsBuckets.sandbox;
    case "staging":
      return config.vendors.cloud.gcp.secretsBuckets.staging;
    case "development":
      return config.vendors.cloud.gcp.secretsBuckets.development;
    default:
      return "";
  }
};

const create = async (input) => {
  const env = input.env;

  const blossmConfig = rootDir.config();

  const message =
    input.message ||
    fs.readFileSync(path.resolve(process.cwd(), input.file), "utf8");

  await createSecret(input.name, message, {
    project: envProject({ config: blossmConfig, env }),
    ring: "secrets-bucket",
    location: "global",
    bucket: envSecretsBucket({ config: blossmConfig, env }),
  });
  //eslint-disable-next-line no-console
  console.log(
    roboSay("All done. Your secret has been encrypted and uploaded.")
  );
};

export default async (args) => {
  const blossmConfig = rootDir.config();
  const input = await normalize({
    entrypointType: "name",
    args,
    flags: [
      {
        name: "message",
        short: "m",
        type: String,
      },
      {
        name: "file",
        short: "f",
        type: String,
        optional: true,
      },
      {
        name: "env",
        short: "e",
        type: String,
        choices: ["production", "sandbox", "staging", "development"],
        default: blossmConfig.defaultEnv || "development",
      },
    ],
  });

  if (!input.message && !input.file) {
    const { message } = await prompt({
      type: "string",
      name: "message",
      message: roboSay(`What's the secret?`),
    });
    input.message = message;
  }
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
