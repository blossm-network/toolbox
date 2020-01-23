//const deps = require("./deps");

module.exports = async ({ payload, root, context, aggregateFn }) => {
  //eslint-disable-next-line no-console
  console.log("Do something with: ", {
    payload,
    root,
    context,
    aggregateFn
  });

  return { events: [{ payload, root, correctNumber: 0 }] };
};
