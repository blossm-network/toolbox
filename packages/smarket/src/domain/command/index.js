const normalize = require("@sustainers/normalize-cli");

const viewStore = require("./view_store");

const domains = ["view-store"];

module.exports = async args => {
  const input = await normalize({
    entrypointType: "domain",
    choices: domains,
    args
  });

  switch (input.domain) {
  case "view-store":
    return viewStore(input.args);
  }
};
