import deps from "./deps.js";

export default async ({
  permissions = [],
  context = {},
  password = "asdfasdfasdf",
  email,
} = {}) => {
  const accountRoot = deps.uuid();
  const roleRoot = deps.uuid();
  const roleId = deps.uuid();
  const principalRoot = deps.uuid();
  const sessionRoot = deps.uuid();

  // Create the account for the token.
  await deps.eventStore({
    domain: "account",
    service: "core",
  }).add({
    eventData: [
      {
        event: deps.createEvent({
          root: accountRoot,
          payload: {
            principal: {
              root: principalRoot,
              service: process.env.SERVICE,
              network: process.env.NETWORK,
            },
            password: await deps.hash(password),
            email,
          },
          action: "register",
          domain: "account",
          service: "core",
          network: process.env.NETWORK,
        }),
      },
    ],
  });

  // Add permissions to the role
  // and add role to the principal.
  await Promise.all([
    deps.eventStore({
      domain: "role",
      service: "core",
    }).add({
      eventData: [
        {
          event: deps.createEvent({
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
    deps.eventStore({
      domain: "principal",
      service: "core",
    }).add({
      eventData: [
        {
          event: deps.createEvent({
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
  await deps.eventStore({
    domain: "session",
    service: "core",
  }).add({
    eventData: [
      {
        event: deps.createEvent({
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
    body: { _tokens },
  } = await deps.command({
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
        iss: `session.core.${process.env.NETWORK}/upgrade`,
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

  return { token: _tokens[0].value };
};
