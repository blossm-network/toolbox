import deps from "./deps.js";

export default ({ blockchainStore }) =>
  ({ block, transaction }) =>
    deps.db.save({ store: blockchainStore, data: block, transaction });
