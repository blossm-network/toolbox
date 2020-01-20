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
        ...context
      }
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

// module.exports = async ({ permissions = [], issueFn, answerFn }) => {
//   const identityRoot = await uuid();
//   const principleRoot = await uuid();
//   const identityEvent = await createEvent({
//     root: identityRoot,
//     payload: {
//       principle: principleRoot,
//       phone
//     },
//     action: "attempt-register",
//     domain: "identity",
//     service: process.env.SERVICE
//   });

//   await eventStore({
//     domain: "identity"
//   }).add(identityEvent);

//   const sentAfter = new Date();

//   const { token: anonymousToken } = await command({
//     action: "start",
//     domain: "session"
//   }).issue({
//     device: {
//       os: "test",
//       hardware: "test",
//       version: "test",
//       manufacturer: "test",
//       id: "test"
//     }
//   });

//   //eslint-disable-next-line
//   console.log("anonymous token: ", anonymousToken);

//   const { token } = issueFn
//     ? await issueFn({ phone, token: anonymousToken })
//     : await command({
//         action: "issue",
//         domain: "challenge"
//       })
//         .set({ context: {} })
//         .issue({ phone });

//   //eslint-disable-next-line
//   console.log("issue token: ", token);

//   const jwt = await validateJwt({
//     token,
//     verifyFn: verify({
//       ring: process.env.SERVICE,
//       key: "challenge",
//       location: "global",
//       version: "1",
//       project: process.env.GCP_PROJECT
//     })
//   });

//   const [message] = await sms(
//     await secret("twilio-account-sid"),
//     await secret("twilio-auth-token")
//   ).list({ sentAfter, limit: 1, to: "+12513332037" });

//   const code = message.body.substr(0, 6);

//   const principleEvent = await createEvent({
//     root: principleRoot,
//     payload: {
//       permissions: [`challenge:answer:${jwt.context.challenge}`, ...permissions]
//     },
//     action: "add-permissions",
//     domain: "principle",
//     service: process.env.SERVICE
//   });

//   await eventStore({
//     domain: "principle"
//   }).add(principleEvent);

//   const { token: answerToken } = answerFn
//     ? await answerFn({
//         code,
//         token,
//         identity: jwt.context.identity
//       })
//     : await command({
//         action: "answer",
//         domain: "challenge"
//       })
//         .set({
//           context: {
//             challenge: jwt.context.challenge,
//             principle: principleRoot,
//             identity: jwt.context.identity
//           }
//         })
//         .issue({ code });

//   //eslint-disable-next-line
//   console.log("answer token: ", answerToken);

//   return { token: answerToken };
// };

// module.exports = async ({ permissions = [], issueFn, answerFn }) => {
//   const identityRoot = await uuid();
//   const principleRoot = await uuid();
//   const identityEvent = await createEvent({
//     root: identityRoot,
//     payload: {
//       principle: principleRoot,
//       phone
//     },
//     action: "attempt-register",
//     domain: "identity",
//     service: process.env.SERVICE
//   });

//   await eventStore({
//     domain: "identity"
//   }).add(identityEvent);

//   const sentAfter = new Date();

//   const { token: anonymousToken } = await command({
//     action: "start",
//     domain: "session"
//   }).issue({
//     device: {
//       os: "test",
//       hardware: "test",
//       version: "test",
//       manufacturer: "test",
//       id: "test"
//     }
//   });

//   //eslint-disable-next-line
//   console.log("anonymous token: ", anonymousToken);

//   const { token } = issueFn
//     ? await issueFn({ phone, token: anonymousToken })
//     : await command({
//         action: "issue",
//         domain: "challenge"
//       })
//         .set({ context: { identity: identityRoot } })
//         .issue({ phone });

//   //eslint-disable-next-line
//   console.log("issue token: ", token);

//   const jwt = await validateJwt({
//     token,
//     verifyFn: verify({
//       ring: process.env.SERVICE,
//       key: "challenge",
//       location: "global",
//       version: "1",
//       project: process.env.GCP_PROJECT
//     })
//   });

//   const [message] = await sms(
//     await secret("twilio-account-sid"),
//     await secret("twilio-auth-token")
//   ).list({ sentAfter, limit: 1, to: "+12513332037" });

//   const code = message.body.substr(0, 6);

//   const principleEvent = await createEvent({
//     root: principleRoot,
//     payload: { permissions },
//     action: "add-permissions",
//     domain: "principle",
//     service: process.env.SERVICE
//   });

//   await eventStore({
//     domain: "principle"
//   }).add(principleEvent);

//   const { token: answerToken } = answerFn
//     ? await answerFn({ code, token })
//     : await command({
//         action: "answer",
//         domain: "challenge"
//       })
//         .set({
//           context: {
//             challenge: jwt.context.challenge,
//             principle: principleRoot,
//             identity: jwt.context.identity
//           }
//         })
//         .issue({ code });

//   //eslint-disable-next-line
//   console.log("answer token: ", answerToken);

//   return { token: answerToken };
// };
