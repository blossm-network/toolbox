import fs from "fs-extra";
import path from "path";
import { prompt } from "inquirer";
import normalize from "@blossm/normalize-cli";
import roboSay from "@blossm/robo-say";

const create = async (input) => {
  const blossmDir = path.resolve(process.cwd(), input.dir || "");

  //If there's already a directory in the intended location, ask if it should be overwritten.
  if (fs.existsSync(blossmDir) && input.dir) {
    const { flag } = await prompt({
      type: "Boolean",
      name: "flag",
      default: true,
      message: roboSay(
        "There's already a directory here. Do you really want to overwrite it?"
      ),
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

  // Copy the template config.yaml file and template service and context dirs
  // into the directory
  const templateConfigPath = path.resolve(__dirname, "template_config.yaml");
  const templateServicesDir = path.resolve(__dirname, "template_services");
  const templateViewsDir = path.resolve(__dirname, "template_views");
  const destinationConfigPath = path.resolve(blossmDir, "config.yaml");
  const destinationServicesDir = path.resolve(blossmDir, "services");
  const destinationViewsDir = path.resolve(blossmDir, "views");
  fs.copyFileSync(templateConfigPath, destinationConfigPath);
  await fs.copy(templateServicesDir, destinationServicesDir);
  await fs.copy(templateViewsDir, destinationViewsDir);
};

export default async (args) => {
  const input = await normalize({
    entrypointType: "dir",
    entrypointDefault: "blossm",
    args,
  });

  create(input);
};
