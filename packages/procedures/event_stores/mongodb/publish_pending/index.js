import deps from "./deps.js";

export default ({ publicationsStore, publishFn, batchSize }) =>
  deps.deliverPending({
    store: publicationsStore,
    batchSize,
    key: "hash",
    db: deps.db,
    deliverFn: ({ data, topic }) => publishFn(data, topic),
  });
