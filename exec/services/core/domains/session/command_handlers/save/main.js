const deps = require("./deps");

const getEventsForPermissionsMerge = async ({
  principle,
  session,
  aggregateFn
}) => {
  // Get the aggregates of the principle of the identity and the current principle of the session.
  const [
    { aggregate: principleAggregate },
    { aggregate: sessionPrincipleAggregate }
  ] = await Promise.all([
    aggregateFn(principle.root, {
      domain: "principle"
    }),
    aggregateFn(session.sub, {
      domain: "principle"
    })
  ]);

  // Don't create an event if nothing is being saved.
  if (
    deps.difference(principleAggregate.roles, sessionPrincipleAggregate.roles)
      .length == 0
  )
    return { events: [], principle };

  return {
    events: [
      {
        domain: "principle",
        action: "add-roles",
        root: principle.root,
        payload: {
          roles: sessionPrincipleAggregate.roles
        }
      }
    ],
    principle
  };
};

const getEventsForIdentityRegistering = async ({ subject, payload }) => {
  const identityRoot = deps.uuid();
  const principleRoot = subject || deps.uuid();
  const hashedPhone = await deps.hash(payload.phone);

  const principle = {
    root: principleRoot,
    service: process.env.SERVICE,
    network: process.env.NETWORK
  };

  return {
    events: [
      {
        action: "register",
        domain: "identity",
        root: identityRoot,
        payload: {
          phone: hashedPhone,
          id: payload.id,
          principle
        }
      },
      {
        action: "add-roles",
        domain: "principle",
        root: principleRoot,
        payload: {
          roles: [
            {
              id: "IdentityAdmin",
              service: process.env.SERVICE,
              network: process.env.NETWORK
            }
          ]
        }
      }
    ],
    principle
  };
};

module.exports = async ({ payload, context, session, aggregateFn }) => {
  // Check to see if there is an identity with the provided id.
  const [identity] = await deps
    .eventStore({
      domain: "identity"
    })
    .set({ context, session, tokenFn: deps.gcpToken })
    .query({ key: "id", value: payload.id });

  if (identity) {
    if (!(await deps.compare(payload.phone, identity.state.phone)))
      throw deps.invalidArgumentError.message("This phone number isn't right.");

    if (session.sub) {
      // Don't log an event or issue a challange if
      // the identity's root is already set as the session's subject.
      if (identity.state.principle.root == session.sub) return {};

      const [subjectIdentity] = await deps
        .eventStore({
          domain: "identity"
        })
        .set({ context, session, tokenFn: deps.gcpToken })
        .query({ key: "principle.root", value: session.sub });

      if (subjectIdentity)
        throw deps.badRequestError.message(
          "The session is already saved to a different identity."
        );
    }
  }

  // If an identity is found, merge the roles given to the session's subject
  // to the identity's principle.
  // If not found, register a new identity and set the principle to be the session's subject.
  const { events, principle } = identity
    ? await getEventsForPermissionsMerge({
        principle: identity.state.principle,
        session,
        aggregateFn
      })
    : await getEventsForIdentityRegistering({
        subject: session.sub,
        payload
      });

  const { tokens } = await deps
    .command({
      name: "issue",
      domain: "challenge"
    })
    .set({
      context,
      session: {
        ...session,
        sub: principle.root
      },
      tokenFn: deps.gcpToken
    })
    .issue(
      {
        id: payload.id,
        phone: payload.phone
      },
      {
        options: { principle, events }
      }
    );

  return { response: { tokens } };
};
