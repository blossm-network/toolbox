const deps = require("./deps");

module.exports = async event => {
  const root = event.headers.root;
  const context = event.headers.context;

  await deps
    .viewStore({
      name: "codes",
      domain: "challenge"
    })
    .set({ context, tokenFn: deps.gcpToken })
    .update(root, {
      code: event.payload.code,
      expires: deps.stringFromDate(
        deps
          .moment()
          .add(event.payload.expires, "s")
          .toDate()
      )
    });
};
