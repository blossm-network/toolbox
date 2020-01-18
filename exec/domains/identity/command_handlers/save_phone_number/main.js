//const deps = require("./deps");

module.exports = async ({ payload, root, context, aggregateFn }) => {
  //issue challenge and get back a token;
  //create a new root for the identity;
  //publish a save-phone-number event;
  //eslint-disable-next-line no-console
  console.log("Do something with: ", {
    payload,
    root,
    context,
    aggregateFn
  });

  return { events: [{ payload, root, correctNumber: 0 }] };
};
