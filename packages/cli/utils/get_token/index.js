const eventStore = require("@blossm/event-store-rpc");
const command = require("@blossm/command-rpc");
const sms = require("@blossm/twilio-sms");
const { validate: validateJwt } = require("@blossm/jwt");
const { get: secret } = require("@blossm/gcp-secret");
const { verify } = require("@blossm/gcp-kms");
// const { stringFromDate, moment } = require("@blossm/datetime");
const createEvent = require("@blossm/create-event");

const uuid = require("@blossm/uuid");

const phone = "251-333-2037";

module.exports = async ({ permissions = [], issueFn, answerFn }) => {
  const identityRoot = await uuid();
  const principleRoot = await uuid();
  const identityEvent = await createEvent({
    root: identityRoot,
    payload: {
      principle: principleRoot,
      phone
    },
    action: "attempt-register",
    domain: "identity",
    service: process.env.SERVICE
  });

  //eslint-disable-next-line
  console.log("identity event: ", event);

  await eventStore({
    domain: "identity"
  }).add(identityEvent);

  const sentAfter = new Date();

  const { token } = issueFn
    ? await issueFn({ phone })
    : await command({
        action: "issue",
        domain: "challenge"
      }).issue({ phone });

  const jwt = await validateJwt({
    token,
    verifyFn: verify({
      ring: process.env.SERVICE,
      key: "challenge",
      location: "global",
      version: "1",
      project: process.env.GCP_PROJECT
    })
  });

  const [message] = await sms(
    await secret("twilio-account-sid"),
    await secret("twilio-auth-token")
  ).list({ sentAfter, limit: 1, to: "+12513332037" });

  const code = message.body.substr(0, 6);

  const principleEvent = await createEvent({
    root: principleRoot,
    payload: {
      permissions: [`challenge:answer:${jwt.context.challenge}`, ...permissions]
    },
    action: "add-permissions",
    domain: "principle",
    service: process.env.SERVICE
  });

  await eventStore({
    domain: "principle"
  }).add(principleEvent);

  const { token: answerToken } = answerFn
    ? await answerFn({
        code,
        root: jwt.context.challenge,
        token,
        identity: jwt.context.identity
      })
    : await command({
        action: "answer",
        domain: "challenge"
      })
        .set({
          context: {
            principle: principleRoot,
            identity: jwt.context.identity
          }
        })
        .issue({ code }, { root: jwt.context.challenge });

  return { token: answerToken };
};
