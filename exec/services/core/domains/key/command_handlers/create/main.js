const deps = require("./deps");

module.exports = async ({ payload }) => {
  //}, context, aggregateFn }) => {
  const root = await deps.uuid();

  //create an id.
  // const id = randomStringOfLength(20);
  // const secret = randomStringOfLength(20);
  // const hash = await deps.hash(secret);
  // const network = context.network;

  //create a secret.
  //hash the secret.

  //return the id and the secret to the client.

  //save an event with the name, id, and hash of the secret.

  return { events: [{ payload, root, correctNumber: 0 }] };
};
