const {
  SECONDS_IN_HOUR,
  SECONDS_IN_MINUTE
} = require("@blossm/duration-consts");

const deps = require("./deps");

const ONE_HOUR = SECONDS_IN_HOUR;
const THREE_MINUTES = 3 * SECONDS_IN_MINUTE;

const CODE_LENGTH = 6;

let sms;

module.exports = async ({
  payload,
  context,
  options: { events, exists = true } = {}
}) => {
  // Lazily load up the sms connection.
  if (!sms) {
    sms = deps.sms(
      await deps.secret("twilio-account-sid"),
      await deps.secret("twilio-auth-token")
    );
  }

  // Check to see if the phone is recognized
  const [identity] = await deps
    .eventStore({
      domain: "identity"
    })
    .set({ context, tokenFn: deps.gcpToken })
    .query({ key: "phone", value: payload.phone });

  if (!identity && exists) throw deps.invalidArgumentError.phoneNotRecognized();

  // Create the root for this challenge.
  const root = await deps.uuid();

  // Create a token that can only access the answer challenge command.
  const token = await deps.createJwt({
    options: {
      issuer: `challenge.${process.env.SERVICE}.${process.env.NETWORK}/issue`,
      audience: `challenge.${process.env.SERVICE}.${process.env.NETWORK}/answer`,
      expiresIn: ONE_HOUR
    },
    payload: {
      context: {
        ...context,
        ...(identity && { identity: identity.headers.root }),
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

  // Create a challenge code.
  const code = deps.randomIntOfLength(CODE_LENGTH);

  // Send the code.
  sms.send({
    to: payload.phone,
    from: "+14157700262",
    body: `${code} is your verification code. Enter it in the app to let us know it's really you.`
  });

  // Send the token to the requester so they can access the answer command.
  return {
    events: [
      {
        payload: {
          code,
          ...(identity && { principle: identity.state.principle }),
          phone: payload.phone,
          issued: deps.stringDate(),
          expires: deps
            .moment()
            .add(THREE_MINUTES, "s")
            .toDate()
            .toISOString(),
          ...(events && { events })
        },
        root,
        correctNumber: 0
      }
    ],
    response: { token }
  };
};
