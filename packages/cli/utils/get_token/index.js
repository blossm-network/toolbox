const eventStore = require("@blossm/event-store-rpc");
const command = require("@blossm/command-rpc");
const uuid = require("@blossm/uuid");
const createEvent = require("@blossm/create-event");
const { hash } = require("@blossm/crypt");

module.exports = async ({
  permissions = [],
  context = {},
  phone = "+19195551144",
  id
} = {}) => {
  const identityRoot = uuid();
  const roleRoot = uuid();
  const roleId = uuid();
  const principleRoot = uuid();
  const sessionRoot = uuid();

  // Create the identity for the token.
  await eventStore({
    domain: "identity"
  }).add([
    {
      data: createEvent({
        root: identityRoot,
        payload: {
          principle: {
            root: principleRoot,
            service: process.env.SERVICE,
            network: process.env.NETWORK
          },
          phone: await hash(phone),
          id
        },
        action: "register",
        domain: "identity",
        service: process.env.SERVICE
      })
    }
  ]);

  // Add permissions to the role
  // and add role to the principle.
  await Promise.all([
    eventStore({
      domain: "role"
    }).add([
      {
        data: createEvent({
          root: roleRoot,
          payload: {
            id: roleId,
            permissions
          },
          action: "create",
          domain: "role",
          service: process.env.SERVICE
        })
      }
    ]),
    eventStore({
      domain: "principle"
    }).add([
      {
        data: createEvent({
          root: principleRoot,
          payload: {
            roles: [
              {
                id: roleId,
                service: process.env.SERVICE,
                network: process.env.NETWORK
              }
            ]
          },
          action: "add-roles",
          domain: "principle",
          service: process.env.SERVICE
        })
      }
    ])
  ]);

  // Add a session.
  await eventStore({
    domain: "session"
  }).add([
    {
      data: createEvent({
        root: sessionRoot,
        payload: {},
        action: "start",
        domain: "session",
        service: process.env.SERVICE
      })
    }
  ]);

  const { tokens } = await command({
    name: "upgrade",
    domain: "session"
  })
    .set({
      context: {
        ...context,
        session: {
          root: sessionRoot,
          service: process.env.SERVICE,
          network: process.env.NETWORK
        }
      },
      claims: {
        iss: `session.${process.env.SERVICE}.${process.env.NETWORK}/upgrade`,
        aud: `${process.env.NETWORK}`,
        exp: "9999-12-31T00:00:00.000Z"
      }
    })
    .issue(
      {
        principle: principleRoot
      },
      { root: sessionRoot }
    );

  return { token: tokens[0].value };
};
