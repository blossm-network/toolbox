const deps = require("./deps");

module.exports = ({ proofsStore }) => async ({ id, update }) => {
  const formattedUpdate = {};
  for (const key in update) {
    formattedUpdate[`metadata.${key}`] = update[key];
  }
  await deps.db.write({
    store: proofsStore,
    query: { id },
    update: {
      ...formattedUpdate,
      updated: deps.dateString(),
    },
  });
};
