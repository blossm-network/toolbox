import deps from "./deps.js";

export default ({ publicationsStore, publishFn, batchSize }) =>
  deps.deliverPending({
    store: publicationsStore,
    key: "hash",
    db: deps.db,
    batchSize,
    deliverFn: ({ data, topic }) => publishFn(data, topic),
  });
