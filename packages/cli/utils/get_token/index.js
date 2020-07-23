const eventStore = require("@blossm/event-store-rpc");
const command = require("@blossm/command-rpc");
const uuid = require("@blossm/uuid");
const createEvent = require("@blossm/create-event");
const { hash } = require("@blossm/crypt");

module.exports = async ({
  permissions = [],
  context = {},
  phone = "+19195551144",
  id,
} = {}) => {
  const identityRoot = uuid();
  const roleRoot = uuid();
  const roleId = uuid();
  const principalRoot = uuid();
  const sessionRoot = uuid();

  // Create the identity for the token.
  await eventStore({
    domain: "identity",
    service: "core",
  }).add({
    eventData: [
      {
        event: createEvent({
          root: identityRoot,
          payload: {
            principal: {
              root: principalRoot,
              service: process.env.SERVICE,
              network: process.env.NETWORK,
            },
            phone: await hash(phone),
            id,
          },
          action: "register",
          domain: "identity",
          service: "core",
          network: process.env.NETWORK,
        }),
      },
    ],
  });

  // Add permissions to the role
  // and add role to the principal.
  await Promise.all([
    eventStore({
      domain: "role",
      service: "core",
    }).add({
      eventData: [
        {
          event: createEvent({
            root: roleRoot,
            payload: {
              id: roleId,
              permissions,
            },
            action: "create",
            domain: "role",
            service: "core",
            network: process.env.NETWORK,
          }),
        },
      ],
    }),
    eventStore({
      domain: "principal",
      service: "core",
    }).add({
      eventData: [
        {
          event: createEvent({
            root: principalRoot,
            payload: {
              roles: [
                {
                  id: roleId,
                  service: process.env.SERVICE,
                  network: process.env.NETWORK,
                },
              ],
            },
            action: "add-roles",
            domain: "principal",
            service: "core",
            network: process.env.NETWORK,
          }),
        },
      ],
    }),
  ]);

  // Add a session.
  await eventStore({
    domain: "session",
    service: "core",
  }).add({
    eventData: [
      {
        event: createEvent({
          root: sessionRoot,
          payload: {},
          action: "start",
          domain: "session",
          service: "core",
          network: process.env.NETWORK,
        }),
      },
    ],
  });

  const {
    body: { tokens },
  } = await command({
    name: "upgrade",
    domain: "session",
    service: "core",
  })
    .set({
      context: {
        network: process.env.NETWORK,
        ...context,
        session: {
          root: sessionRoot,
          service: process.env.SERVICE,
          network: process.env.NETWORK,
        },
      },
      claims: {
        iss: `session.${process.env.SERVICE}.${process.env.NETWORK}/upgrade`,
        aud: `${process.env.NETWORK}`,
        exp: "9999-12-31T00:00:00.000Z",
      },
    })
    .issue(
      {
        principal: {
          root: principalRoot,
          service: "core",
          network: process.env.NETWORK,
        },
      },
      { root: sessionRoot }
    );

  return { token: tokens[0].value };
};
