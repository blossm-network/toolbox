import deps from "./deps.js";

export default ({ eventStore }) => ({ query, sort }) =>
  deps.db.find({
    store: eventStore,
    query,
    ...(sort && { sort }),
    limit: 100,
    options: {
      lean: true,
    },
  });
