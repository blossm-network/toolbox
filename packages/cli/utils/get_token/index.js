const viewStore = require("@blossm/view-store-rpc");
const command = require("@blossm/command-rpc");
const sms = require("@blossm/twilio-sms");
const { validate: validateJwt } = require("@blossm/jwt");
const { get: secret } = require("@blossm/gcp-secret");
const { verify } = require("@blossm/gcp-kms");
const { stringFromDate, moment } = require("@blossm/datetime");

const uuid = require("@blossm/uuid");

const userRoot = uuid();
const principleRoot = uuid();
const phone = "251-333-2037";

module.exports = async ({ permissions = [], issueFn, answerFn }) => {
  await viewStore({
    name: "phones",
    domain: "user"
  })
    //phone should be already formatted in the view store.
    .update(userRoot, { principle: principleRoot, phone: "+12513332037" });

  // await eventStore({
  //   domain: "user"
  // }).add(
  //   createEvent({
  //     root: userRoot,
  //     payload: {
  //       phone
  //     },
  //     action: "save-phone-number",
  //     domain: process.env.DOMAIN,
  //     service: process.env.SERVICE
  //   })
  // );

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

  await viewStore({
    name: "codes",
    domain: "challenge"
  }).update(jwt.context.challenge, {
    code,
    expires: stringFromDate(
      moment()
        .add(30, "s")
        .toDate()
    )
  });

  await viewStore({
    name: "permissions",
    domain: "principle"
  }).update(principleRoot, {
    add: [`challenge:answer:${jwt.context.challenge}`, ...permissions]
  });

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
