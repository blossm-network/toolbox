const viewStore = require("@blossm/view-store-rpc");
const command = require("@blossm/command-rpc");
const sms = require("@blossm/twilio-sms");
const { validate: validateJwt } = require("@blossm/jwt");
const { get: secret } = require("@blossm/gcp-secret");
const { verify } = require("@blossm/gcp-kms");

const uuid = require("@blossm/uuid");

const personRoot = uuid();
const principleRoot = uuid();
const phone = "251-333-2037";

module.exports = async ({ permissions = [], issueFn, answerFn }) => {
  await Promise.all([
    viewStore({
      name: "permissions",
      domain: "principle"
    }).update(principleRoot, { add: ["challenge:answer", ...permissions] }),
    viewStore({
      name: "phones",
      domain: "person"
    })
      //phone should be already formatted in the view store.
      .update(personRoot, { principle: principleRoot, phone: "+12513332037" })
  ]);

  const sentAfter = new Date();

  const { token, root } = issueFn
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

  const { token: answerToken } = answerFn
    ? await answerFn({ code, root, token })
    : await command({
        action: "answer",
        domain: "challenge"
      }).issue({
        code,
        context: {
          challenge: root,
          person: jwt.person
        }
      });

  return { token: answerToken, root };
};
