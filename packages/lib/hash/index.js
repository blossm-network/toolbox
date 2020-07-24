const keccak = require("keccak");

const deps = require("./deps");

const update = (value, { hash } = {}) => {
  const newHash = (hash || keccak("keccak256")).update(
    typeof value == "object"
      ? deps.cononicalString(JSON.stringify(value))
      : value
  );
  return {
    update: (value) => update(value, { hash: newHash }),
    create: () => newHash.digest("hex"),
  };
};

module.exports = update;
