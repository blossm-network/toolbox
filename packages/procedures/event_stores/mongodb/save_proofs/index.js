const deps = require("./deps");

module.exports = ({ proofsStore, updateProofFn }) => async (proofs) => {
  const date = deps.dateString();
  await Promise.all([
    deps.db.create({
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
    }),
    ...proofs.map((proof) => updateProofFn(proof.id)),
  ]);
};
