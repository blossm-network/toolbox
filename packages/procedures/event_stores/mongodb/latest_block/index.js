const deps = require("./deps");

module.exports = ({ blockchainStore }) => () =>
  deps.db.findOne({
    store: blockchainStore,
    query: {},
    sort: {
      number: -1,
    },
    options: { lean: true },
  });
