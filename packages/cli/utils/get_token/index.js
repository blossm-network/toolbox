const eventStore = require("@blossm/event-store-rpc");
const command = require("@blossm/command-rpc");
const uuid = require("@blossm/uuid");
const createEvent = require("@blossm/create-event");

module.exports = async ({
  permissions = [],
  context = {},
  phone = "+19195551144"
} = {}) => {
  const [identityRoot, principleRoot, sessionRoot] = await Promise.all([
    uuid(),
    uuid(),
    uuid()
  ]);

  // Create the identity for the token.
  await eventStore({
    domain: "identity"
  }).add(
    await createEvent({
      root: identityRoot,
      payload: {
        principle: principleRoot,
        phone
      },
      action: "register",
      domain: "identity",
      service: process.env.SERVICE
    })
  );

  // Add permissions to the principle
  await eventStore({
    domain: "principle"
  }).add(
    await createEvent({
      root: principleRoot,
      payload: {
        permissions
      },
      action: "add-permissions",
      domain: "principle",
      service: process.env.SERVICE
    })
  );

  // // Start a session for the identity.
  // await command({
  //   action: "start",
  //   domain: "session"
  // }).issue({
  //   device: {
  //     os: "test",
  //     hardware: "test",
  //     version: "test",
  //     manufacturer: "test",
  //     id: "test"
  //   }
  // });

  // Add a session.
  await eventStore({
    domain: "session"
  }).add(
    await createEvent({
      root: sessionRoot,
      payload: {},
      action: "start",
      domain: "session",
      service: process.env.SERVICE
    })
  );

  const { token } = await command({
    action: "upgrade",
    domain: "session"
  })
    .set({
      context: {
        service: process.env.SERVICE,
        network: process.env.NETWORK,
        ...context,
        session: sessionRoot
      },
      session: {
        iss: `session.${process.env.SERVICE}.${process.env.NETWORK}/upgrade`,
        aud: `${process.env.SERVICE}.${process.env.NETWORK}`,
        exp: "9999-12-31T00:00:00.000Z"
      }
    })
    .issue(
      {
        principle: principleRoot
      },
      { root: sessionRoot }
    );

  return { token };
};
