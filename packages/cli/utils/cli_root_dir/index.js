const path = require("path");
const findUp = require("find-up");
const yaml = require("yaml");
const fs = require("fs");
const roboSay = require("@blossm/robo-say");
const configPath = findUp.sync("config.yaml", { type: "file" });

module.exports = {
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
