const eventStore = require("@blossm/event-store-rpc");
const command = require("@blossm/command-rpc");
const uuid = require("@blossm/uuid");
const createEvent = require("@blossm/create-event");

module.exports = async ({
  permissions = [],
  context = {},
  phone = "+19195551144"
} = {}) => {
  const [identityRoot, principleRoot] = await Promise.all([uuid(), uuid()]);

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
      action: "attempt-register",
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

  // Start a session for the identity.
  const { token } = await command({
    action: "start",
    domain: "session"
  })
    .set({
      context: {
        identity: identityRoot,
        principle: principleRoot,
        ...context,
        service: process.env.SERVICE,
        network: process.env.NETWORK
      }
      // No need to include a tokenFn because this should
      // only be called in testing.
    })
    .issue({
      device: {
        os: "test",
        hardware: "test",
        version: "test",
        manufacturer: "test",
        id: "test"
      }
    });

  return { token };
};
