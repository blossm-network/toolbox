import deps from "./deps.js";

export default ({ blockchainStore }) => ({ transaction } = {}) =>
  deps.db.findOne({
    store: blockchainStore,
    query: {},
    sort: {
      "headers.number": -1,
    },
    options: { lean: true, ...(transaction && { session: transaction }) },
  });
