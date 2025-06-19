import path from "path";
import findUp from "find-up";
import yaml from "yaml";
import fs from "fs";
import roboSay from "@blossm/robo-say";
const configPath = findUp.sync("config.yaml", { type: "file" });

export default {
  path: () => {
    try {
      return path.dirname(configPath);
    } catch (e) {
      roboSay("Looks like you're not in a blossm repo with a config.yaml");
    }
  },
  config: () => {
    try {
      return yaml.parse(fs.readFileSync(configPath, "utf8"));
    } catch (e) {
      roboSay("Looks like you're not in a blossm repo with a config.yaml");
    }
  },
};
