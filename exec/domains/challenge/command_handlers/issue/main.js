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
  session,
  // `events` are any events to submit once the challenge is answered.
  // `principle` is the principle to set as the subject of the session token.
  options: { events, principle } = {}
}) => {
  // Lazily load up the sms connection.
  if (!sms) {
    sms = deps.sms(
      await deps.secret("twilio-account-sid"),
      await deps.secret("twilio-auth-token")
    );
  }

  // Check to see if the phone is recognized.
  // If identity and principle roots are passed in, use theme as the identity instead.
  const [identity] = principle
    ? [{ state: { principle } }]
    : await deps
        .eventStore({ domain: "identity" })
        .set({ context, tokenFn: deps.gcpToken })
        .query({ key: "id", value: payload.id });

  if (!identity) throw deps.invalidArgumentError.phoneNotRecognized();

  if (session.sub && session.sub != identity.state.principle)
    throw deps.badRequestError.message(
      "This principle can't be challenged during the current session."
    );

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
          principle: identity.state.principle,
          session,
          phone: deps.hash(payload.phone),
          id: payload.id,
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
