const viewComposite = require("@blossm/view-composite");
const viewStore = require("@blossm/view-store-rpc");
const gcpToken = require("@blossm/gcp-token");

const main = require("./main.js");

module.exports = viewComposite({
  mainFn: main,
  viewsFn: ({ context: contexts, claims, token }) => async ({
    name,
    context = process.env.CONTEXT,
    query,
    sort,
  }) => {
    await viewStore({
      name,
      context,
    })
      .set({
        ...(contexts && { context: contexts }),
        ...(claims && { claims }),
        ...(token && { currentToken: token }),
        token: { internalFn: gcpToken },
      })
      .read({ query, ...(sort && { sort }) });
  },
});
