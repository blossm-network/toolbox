const viewStore = require("@blossm/view-store-rpc");
const eventStore = require("@blossm/event-store-rpc");
const command = require("@blossm/command-rpc");
const sms = require("@blossm/twilio-sms");
const { validate: validateJwt } = require("@blossm/jwt");
const { get: secret } = require("@blossm/gcp-secret");
const { verify } = require("@blossm/gcp-kms");
// const { stringFromDate, moment } = require("@blossm/datetime");
const createEvent = require("@blossm/create-event");

const uuid = require("@blossm/uuid");

const userRoot = uuid();
const principleRoot = uuid();
const phone = "251-333-2037";

module.exports = async ({ permissions = [], issueFn, answerFn }) => {
  // await viewStore({
  //   name: "phones",
  //   domain: "user"
  // })
  //   //phone should be already formatted in the view store.
  //   .update(userRoot, { principle: principleRoot, phone: "+12513332037" });

  const userEvent = await createEvent({
    root: userRoot,
    payload: {
      principle: principleRoot,
      phone
    },
    action: "save-phone-number",
    domain: "user",
    service: process.env.SERVICE
  });

  await eventStore({
    domain: "user"
  }).add(userEvent);

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

  // await viewStore({
  //   name: "codes",
  //   domain: "challenge"
  // }).update(jwt.context.challenge, {
  //   code,
  //   expires: stringFromDate(
  //     moment()
  //       .add(30, "s")
  //       .toDate()
  //       .toISOString()
  //   )
  // });

  await viewStore({
    name: "permissions",
    domain: "principle"
  }).update(principleRoot, {
    add: [`challenge:answer:${jwt.context.challenge}`, ...permissions]
  });

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
        user: jwt.context.user
      })
    : await command({
        action: "answer",
        domain: "challenge"
      })
        .set({
          context: {
            principle: principleRoot,
            user: jwt.context.user
          }
        })
        .issue(
          {
            code
          },
          { root: jwt.context.challenge }
        );

  return { token: answerToken };
};
