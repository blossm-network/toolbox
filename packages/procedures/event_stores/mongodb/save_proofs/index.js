const deps = require("./deps");

module.exports = ({ proofsStore }) => async (proofs) => {
  const date = deps.dateString();
  await deps.db.create({
    store: proofsStore,
    data: proofs.map((p) => {
      return {
        type: p.type,
        id: p.id,
        created: date,
        updated: date,
        metadata: p.metadata,
      };
    }),
  });
};
