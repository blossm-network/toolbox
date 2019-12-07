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
      network: config.network || oldConfig.network,
      vendors: config.vendors
        ? {
            cloud: {
              ...oldConfig.vendors.cloud,
              ...config.vendors.cloud
            },
            viewStore: {
              ...oldConfig.vendors.viewStore,
              ...config.vendors.viewStore
            },
            eventStore: {
              ...oldConfig.vendors.eventStore,
              ...config.vendors.eventStore
            }
          }
        : oldConfig.vendors,
      defaults: config.defaults
        ? {
            ...oldConfig.defaults,
            ...config.defaults
          }
        : oldConfig.defaults
    };

    fs.writeFileSync(configPath, JSON.stringify(newConfig));
  }
};
