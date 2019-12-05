const normalize = require("@blossm/normalize-cli");

const network = require("./network");

const properties = ["network"];

module.exports = async args => {
  const input = await normalize({
    entrypointType: "property",
    choices: properties,
    args
  });
  switch (input.property) {
    case "network":
      return network(input.args);
  }
};
