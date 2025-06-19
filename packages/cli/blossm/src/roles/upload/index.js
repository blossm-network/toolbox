import inquirer from "inquirer";
import fs from "fs";
import yaml from "yaml";
import path from "path";
import normalize from "@blossm/normalize-cli";
import roboSay from "@blossm/robo-say";
import { upload as uploadFile } from "@blossm/gcp-storage";
import rootDir from "@blossm/cli-root-dir";
import { red } from "chalk";

const { prompt } = inquirer;

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

const upload = async (input) => {
  const env = input.env;
  const rolesPath = input.path;

  const blossmConfig = rootDir.config();
  const roles = yaml.parse(fs.readFileSync(rolesPath, "utf8"));

  if (!roles) {
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        "This roles.yaml file isn't parseable.",
        red.bold("internal error")
      )
    );
    process.exit(1);
  } else {
    for (const id in roles) {
      const role = roles[id];
      if (!role.title) {
        //eslint-disable-next-line no-console
        console.error(
          roboSay("All roles must have a title", red.bold("internal error"))
        );
        process.exit(1);
      }
      if (!role.permissions || role.permissions.length == 0) {
        //eslint-disable-next-line no-console
        console.error(
          roboSay(
            "All roles must have associated permissions",
            red.bold("internal error")
          )
        );
        process.exit(1);
      }
    }
  }

  await uploadFile({
    bucket: envRolesBucket({ config: blossmConfig, env }),
    file: input.path,
    destination: `${
      input.directory ||
      // path.basename(path.resolve(process.cwd()))}/roles.yaml`
      process.cwd().split(path.sep).slice(-3).join("/")
    }/roles.yaml`,
  });

  //eslint-disable-next-line no-console
  console.log(roboSay("All done. Your roles.yaml file is uploaded."));
};

export default async (args) => {
  const blossmConfig = rootDir.config();
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
        default: blossmConfig.defaultEnv || "development",
      },
      {
        name: "directory",
        short: "d",
        type: String,
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

  upload(input);
};
