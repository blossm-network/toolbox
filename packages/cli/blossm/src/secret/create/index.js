const fs = require("fs-extra");
const { prompt } = require("inquirer");
const normalize = require("@blossm/normalize-cli");
const roboSay = require("@blossm/robo-say");
const { encrypt, create: createKey } = require("@blossm/gcp-kms");
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
  const environment = input.environment;

  const blossmConfig = rootDir.config();
  await createKey({
    id: input.name,
    project: `${blossmConfig.vendors.cloud.gcp.project}${environmentSuffix(
      environment
    )}`,
    ring: "secret-bucket",
    location: "global"
  });
  const ciphertext = await encrypt({
    message: input.message,
    key: input.name,
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
    bucket: `${blossmConfig.vendors.cloud.gcp.secretsBucket}${environmentSuffix(
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
  if (!input.message) {
    const { message } = await prompt({
      type: "string",
      name: "message",
      message: roboSay(`What's the secret?`)
    });
    input.message = message;
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
