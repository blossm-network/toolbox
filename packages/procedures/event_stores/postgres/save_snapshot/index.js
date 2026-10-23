import deps from "./deps.js";

export default ({ snapshotStore }) =>
  ({ snapshot, transaction }) =>
    deps.db.save({ store: snapshotStore, data: snapshot, transaction });
