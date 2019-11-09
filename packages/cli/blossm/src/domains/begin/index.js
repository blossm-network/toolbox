const fs = require("fs-extra");
const path = require("path");
const { prompt } = require("inquirer");
const normalize = require("@sustainers/normalize-cli");
const roboSay = require("@sustainers/robo-say");

const create = async input => {
  const blossomDir = path.resolve(process.cwd(), input.path);
  if (fs.existsSync(blossomDir)) {
    const { flag } = await prompt({
      type: "Boolean",
      name: "flag",
      default: true,
      message: roboSay(
        "There's already a blossom directory here. Do you really want to overwrite it?"
      )
    });

    if (!flag) {
      //eslint-disable-next-line no-console
      console.log(roboSay("Got it. I left everything untouched."));
      process.exit(1);
    }
  }

  fs.removeSync(blossomDir);
  fs.mkdirSync(blossomDir);

  const blossomHiddenDir = path.resolve(blossomDir, ".blossom");

  fs.mkdirSync(blossomHiddenDir);

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

  const configPath = path.resolve(blossomHiddenDir, "config.json");
  fs.writeFileSync(configPath, JSON.stringify(config));
};

module.exports = async args => {
  const input = await normalize({
    entrypointType: "path",
    entrypointDefault: "blossom",
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
