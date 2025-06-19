import deps from "./deps.js";

export default ({ countsStore }) => async ({ root }) => {
  const [{ value } = { value: 0 }] = await deps.db.find({
    store: countsStore,
    query: { root },
    options: { lean: true },
  });

  return value;
};
