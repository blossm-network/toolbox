const fact = require("@blossm/fact-rpc");
const { invalidCredentials } = require("@blossm/errors");

module.exports = async ({ scene, token: { internalFn, externalFn } }) => {
  //TODO
  console.log({ scene });
  const { body: deleted } = await fact({
    name: "deleted",
    domain: "scene",
    service: scene.service,
    network: scene.network,
  })
    .set({
      token: {
        internalFn,
        externalFn,
      },
      context: { scene },
    })
    .read();

  if (deleted) throw invalidCredentials.message("This scene has been deleted.");
};
