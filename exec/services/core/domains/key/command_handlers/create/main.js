const deps = require("./deps");

module.exports = async ({ payload, context }) => {
  const node = context.domain == "node" && context.root;

  if (!node) throw "A key can only be made in the context of a node";

  const [keyRoot, principleRoot] = await Promise.all([
    deps.uuid(),
    deps.uuid()
  ]);

  //create an id.
  const id = deps.randomStringOfLength(20);
  const secret = deps.randomStringOfLength(20);
  const hash = await deps.hash(secret);

  //get all permissions for the requesting principle.
  //make sure payload.permissions is a subset.

  ("some-service:some-domain:some-priviledges:some-root");
  return {
    events: [
      {
        action: "add-permissions",
        payload: {
          permissions: payload.permissions
        },
        root: principleRoot
      },
      {
        action: "create",
        payload: {
          name: payload.name,
          node,
          principle: principleRoot,
          id,
          secret: hash
        },
        root: keyRoot
      }
    ],
    response: { id, secret }
  };
};
