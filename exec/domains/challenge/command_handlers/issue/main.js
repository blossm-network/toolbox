const { SECONDS_IN_MINUTE } = require("@blossm/duration-consts");

const deps = require("./deps");

const THREE_MINUTES = 3 * SECONDS_IN_MINUTE;
const CODE_LENGTH = 6;

let sms;

module.exports = async ({ payload, context }) => {
  //Lazily load up the sms connection.
  if (!sms) {
    sms = deps.sms(
      await deps.secret("twilio-account-sid"),
      await deps.secret("twilio-auth-token")
    );
  }

  //Check to see if the phone is recognized
  const [user] = await deps
    .eventStore({
      domain: "user"
    })
    .set({ context, tokenFn: deps.gcpToken })
    .query({ phone: payload.phone });

  if (!user) throw deps.invalidArgumentError.phoneNotRecognized();

  //Create the root for this challenge.
  const root = await deps.uuid();

  //Create a token that can only access the answer challenge command.
  const token = await deps.createJwt({
    options: {
      issuer: `challenge.${process.env.SERVICE}.${process.env.NETWORK}/issue`,
      subject: user.principle,
      audience: `command.challenge.${process.env.SERVICE}.${process.env.NETWORK}/answer`,
      expiresIn: THREE_MINUTES
    },
    payload: {
      context: {
        user: user.id,
        challenge: root,
        service: process.env.SERVICE,
        network: process.env.NETWORK
      }
    },
    signFn: deps.sign({
      ring: process.env.SERVICE,
      key: "challenge",
      location: "global",
      version: "1",
      project: process.env.GCP_PROJECT
    })
  });

  //Create a challenge code.
  const code = deps.randomIntOfLength(CODE_LENGTH);

  //Send the code.
  sms.send({
    to: user.phone,
    from: "+14157700262",
    body: `${code} is your verification code. Enter it in the app to let us know it's really you.`
  });

  //Send the token to the requester so they can access the answer command.
  return {
    events: [
      {
        payload: {
          code,
          principle: user.principle,
          phone: user.phone,
          issued: deps.stringDate(),
          expires: THREE_MINUTES
        },
        root
      }
    ],
    response: { token }
  };
};
