const { conflict } = require("@sustainers/errors");
const { SECONDS_IN_MINUTE } = require("@sustainers/duration-consts");

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
  const [person] = await deps
    .viewStore({
      name: "phones",
      domain: "person",
      service: process.env.SERVICE,
      network: process.env.NETWORK
    })
    .set({ context, tokenFn: deps.gcpToken })
    .read({ phone: payload.phone });

  if (!person) throw conflict.phoneNotRecognized;

  //Create the root for this challenge.
  const root = await deps.uuid();

  //Create a token that can only access the answer challenge command.
  const token = await deps.createJwt({
    options: {
      issuer: `issue.challenge.${process.env.SERVICE}.${process.env.NETWORK}`,
      subject: person.principle,
      audience: `auth.${process.env.SERVICE}.${process.env.NETWORK}/challenge/answer`,
      expiresIn: THREE_MINUTES
    },
    payload: {
      principle: person.principle,
      context: {
        person: person.id,
        challenge: root
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

  //Synchronously save the code to a view store before sending the message.
  await deps
    .viewStore({
      name: "codes",
      domain: "challenge",
      service: process.env.SERVICE,
      network: process.env.NETWORK
    })
    .set({ context, tokenFn: deps.gcpToken })
    .update(root, {
      code,
      expires: deps.stringFromDate(
        deps
          .moment()
          .add(THREE_MINUTES, "s")
          .toDate()
      )
    });

  //Send the code.
  sms.send({
    to: person.phone,
    from: "+14157700262",
    body: `${code} is your Roof verification code. Enter it in the Roof app to let us know it's really you.`
  });

  //Send the token to the requester so they can access the answer command.
  return {
    root,
    payload: {
      code,
      principle: person.principle,
      phone: person.phone,
      issued: deps.stringDate()
    },
    response: { token }
  };
};
