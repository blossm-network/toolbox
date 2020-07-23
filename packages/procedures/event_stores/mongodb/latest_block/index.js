const deps = require("./deps");

module.exports = ({ blockchainStore }) => () =>
  deps.db.findOne({
    store: blockchainStore,
    query: {},
    sort: {
      "headers.number": -1,
    },
    options: { lean: true },
  });
