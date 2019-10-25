const { conflict, internalServer } = require("@sustainers/errors");
const { SECONDS_IN_MINUTE } = require("@sustainers/duration-consts");

const deps = require("./deps");

const THREE_MINUTES = 3 * SECONDS_IN_MINUTE;
const CODE_LENGTH = 6;

let sms;

module.exports = async ({ payload, context }) => {
  if (!sms) {
    sms = deps.sms(
      deps.secret("twilio-account-sid"),
      deps.secret("twilio-auth-token")
    );
  }

  //Create the root for this challenge.
  const root = await deps.uuid();

  //Check to see if the phone is recognized
  const personAccounts = await deps
    .viewStore({
      name: "phones",
      domain: "person-account",
      service: process.env.SERVICE,
      network: process.env.NETWORK
    })
    .set({ context, tokenFn: deps.gcpToken })
    .read({ phone: payload.phone });

  if (personAccounts.length == 0) throw conflict.phoneNotRecognized;
  if (personAccounts.length != 1) throw internalServer.multiplePhonesFound;

  const personAccount = personAccounts[0];

  //Create a token that can only access the answer challenge command.
  const token = await deps.createJwt({
    options: {
      issuer: `issue.challenge.${process.env.SERVICE}.${process.env.NETWORK}`,
      subject: personAccount.principle,
      audience: `auth.${process.env.SERVICE}.${process.env.NETWORK}/challenge/answer`,
      expiresIn: THREE_MINUTES
    },
    payload: {
      root
    },
    signFn: deps.sign
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
    to: personAccount.phone,
    from: "+14157700262",
    body: `${code} is your Roof verification code. Enter it in the Roof app to let us know its really you.`
  });

  //Send the token to the requester so they can access the answer command.
  return {
    payload: {
      code,
      principle: personAccount.principle,
      phone: personAccount.phone,
      issued: deps.stringDate()
    },
    response: { token }
  };
};
