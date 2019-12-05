const path = require("path");
const findUp = require("find-up");
const blossmDir = findUp.sync(".blossm", { type: "directory" });
const fs = require("fs");

module.exports = {
  path: () => path.dirname(blossmDir),
  config: () => require(path.resolve(blossmDir, "config.json")),
  saveConfig: config => {
    const configPath = path.resolve(blossmDir, "config.json");
    const oldConfig = require(configPath);
    const newConfig = {
      providers: {
        cloud: {
          ...oldConfig.providers.cloud,
          ...config.providers.cloud
        },
        viewStore: {
          ...oldConfig.providers.viewStore,
          ...config.providers.viewStore
        },
        eventStore: {
          ...oldConfig.providers.eventStore,
          ...config.providers.eventStore
        }
      }
    };

    fs.writeFileSync(configPath, JSON.stringify(newConfig));
  }
};
