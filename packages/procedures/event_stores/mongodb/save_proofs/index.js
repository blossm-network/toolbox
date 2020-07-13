const deps = require("./deps");

module.exports = ({ proofsStore }) => async (proofs, { transaction } = {}) => {
  const date = deps.dateString();
  //TODO
  //eslint-disable-next-line no-console
  console.log({ transaction1: transaction });

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
      ...(transaction && { options: { session: transaction } }),
    }),
  ]);
};
