const { prompt } = require("inquirer");
const fs = require("fs");
const yaml = require("yaml");
const normalize = require("@blossm/normalize-cli");
const roboSay = require("@blossm/robo-say");
const { upload: uploadFile } = require("@blossm/gcp-storage");
const rootDir = require("@blossm/cli-root-dir");
const { red } = require("chalk");

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
    for (const id in roles.roles) {
      const role = roles.roles[id];
      if (!role.title) {
        //eslint-disable-next-line no-console
        console.error(
          roboSay("All roles must have a title", red.bold("internal error"))
        );
        process.exit(1);
      }
      if (!role.priviledges || role.priviledges.length == 0) {
        //eslint-disable-next-line no-console
        console.error(
          roboSay(
            "All roles must have associated priviledges",
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
    destination: `${roles.service}/${roles.domain}/roles.yaml`
  });

  //eslint-disable-next-line no-console
  console.log(roboSay("All done. Your roles.yaml file is uploaded."));
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
