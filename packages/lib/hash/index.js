const keccak = require("keccak");

const update = (text, { hash } = {}) => {
  const newHash = (hash || keccak("keccak256")).update(text);
  return {
    update: (text) => update(text, { hash: newHash }),
    create: () => newHash.digest("hex"),
  };
};

module.exports = update;
