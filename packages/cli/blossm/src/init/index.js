const fs = require("fs-extra");
const path = require("path");
const { prompt } = require("inquirer");
const normalize = require("@blossm/normalize-cli");
const roboSay = require("@blossm/robo-say");

const create = async input => {
  const blossmDir = path.resolve(process.cwd(), input.dir || "");
  if (fs.existsSync(blossmDir) && input.dir) {
    const { flag } = await prompt({
      type: "Boolean",
      name: "flag",
      default: true,
      message: roboSay(
        "There's already a directory here. Do you really want to overwrite it?"
      )
    });

    if (!flag) {
      //eslint-disable-next-line no-console
      console.log(roboSay("Got it. I left everything untouched."));
      process.exit(1);
    }
  }

  if (input.dir) {
    fs.removeSync(blossmDir);
    fs.mkdirSync(blossmDir);
  }

  const templateConfigPath = path.resolve(__dirname, "config.yaml");
  const destinationConfigPath = path.resolve(blossmDir, "config.yaml");

  fs.copyFileSync(templateConfigPath, destinationConfigPath);
};

module.exports = async args => {
  const input = await normalize({
    entrypointType: "dir",
    default: "blossm",
    args
  });

  create(input);
};
