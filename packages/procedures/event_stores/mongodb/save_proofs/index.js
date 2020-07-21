const deps = require("./deps");

module.exports = ({ proofsStore }) => async (proofs, { transaction } = {}) => {
  await deps.db.create({
    store: proofsStore,
    data: proofs.map((p) => {
      return {
        type: p.type,
        id: p.id,
        hash: p.hash,
        metadata: p.metadata,
      };
    }),
    ...(transaction && { options: { session: transaction } }),
  });
};
