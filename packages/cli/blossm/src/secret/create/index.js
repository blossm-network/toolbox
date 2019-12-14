const fs = require("fs-extra");
const { prompt } = require("inquirer");
const normalize = require("@blossm/normalize-cli");
const roboSay = require("@blossm/robo-say");
const { encrypt } = require("@blossm/gcp-kms");
const { upload } = require("@blossm/gcp-storage");
const rootDir = require("@blossm/cli-root-dir");

const environmentSuffix = env => {
  switch (env) {
    case "production":
      return "";
    case "sandbox":
      return "-sandbox";
    case "staging":
      return "-staging";
  }
};

const create = async input => {
  const name = input.name;
  const message = input.message;
  const environment = input.environment;

  const blossmConfig = rootDir.config();
  const ciphertext = await encrypt({
    message,
    key: name,
    ring: "secret-bucket",
    location: "global",
    project: `${blossmConfig.vendors.cloud.gcp.project}${environmentSuffix(
      environment
    )}`
  });

  //eslint-disable-next-line no-console
  console.log("cipher: ", ciphertext);

  const filename = "tmp.txt";
  await fs.writeFile(filename, ciphertext);
  await upload({
    file: filename,
    bucket: `${blossmConfig.vendors.cloud.gcp.secretBucket}${environmentSuffix(
      environment
    )}`
  });

  //eslint-disable-next-line no-console
  console.log("uploaded");

  await fs.unlink(filename);
};

module.exports = async args => {
  const input = await normalize({
    entrypointType: "name",
    args,
    flags: [
      {
        name: "message",
        short: "-m",
        type: String
      },
      {
        name: "environment",
        short: "-e",
        type: String,
        choices: ["production", "sandbox", "staging"],
        default: "staging"
      }
    ]
  });
  if (!input.messsage) {
    const { messsage } = await prompt({
      type: "string",
      name: "messsage",
      message: roboSay(`What's the secret?`)
    });
    input.messsage = messsage;
  }
  if (!input.environment) {
    const { environment } = await prompt({
      type: "list",
      choices: ["production", "sandbox", "staging"],
      name: "environment",
      message: roboSay(`What's environment is this for?`)
    });
    input.environment = environment;
  }

  create(input);
};
