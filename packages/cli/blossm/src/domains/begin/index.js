const fs = require("fs-extra");
const path = require("path");
const { prompt } = require("inquirer");
const normalize = require("@blossm/normalize-cli");
const roboSay = require("@blossm/robo-say");

const create = async input => {
  const blossmDir = path.resolve(process.cwd(), input.path);
  if (fs.existsSync(blossmDir)) {
    const { flag } = await prompt({
      type: "Boolean",
      name: "flag",
      default: true,
      message: roboSay(
        "There's already a blossm directory here. Do you really want to overwrite it?"
      )
    });

    if (!flag) {
      //eslint-disable-next-line no-console
      console.log(roboSay("Got it. I left everything untouched."));
      process.exit(1);
    }
  }

  fs.removeSync(blossmDir);
  fs.mkdirSync(blossmDir);

  const blossmHiddenDir = path.resolve(blossmDir, ".blossm");

  fs.mkdirSync(blossmHiddenDir);

  const config = {
    providers: {
      cloud: {
        type: input.cloudProvider
      },
      viewStore: {
        type: input.viewStoreProvider
      },
      eventStore: {
        type: input.eventStoreProvider
      }
    }
  };

  const configPath = path.resolve(blossmHiddenDir, "config.json");
  fs.writeFileSync(configPath, JSON.stringify(config));
};

module.exports = async args => {
  const input = await normalize({
    entrypointType: "path",
    entrypointDefault: "blossm",
    args,
    flags: [
      {
        name: "cloud-provider",
        short: "c",
        type: String,
        required: true,
        choices: ["gcp"]
      },
      {
        name: "view-store-provider",
        type: String,
        short: "v",
        required: true,
        choices: ["mongodb"]
      },
      {
        name: "event-store-provider",
        type: String,
        short: "e",
        required: true,
        choices: ["mongodb"]
      }
    ]
  });

  create(input);
};
