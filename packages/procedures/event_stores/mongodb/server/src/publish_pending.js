import deps from "./pending_deps.js";

export default ({ publicationsStore, publishFn }) =>
  deps.deliverPending({
    store: publicationsStore,
    key: "hash",
    db: deps.db,
    deliverFn: ({ data, topic }) => publishFn(data, topic),
  });
