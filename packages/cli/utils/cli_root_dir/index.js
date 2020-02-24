const path = require("path");
const findUp = require("find-up");
const yaml = require("yaml");
const fs = require("fs");
const configPath = findUp.sync("config.yaml", { type: "file" });

module.exports = {
  path: () => path.dirname(configPath),
  config: () => yaml.parse(fs.readFileSync(configPath, "utf8"))
};
