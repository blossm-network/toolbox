import viewComposite from "@blossm/view-composite";
import viewStore from "@blossm/view-store-rpc";
import gcpToken from "@blossm/gcp-token";

import main from "./main.js";

export default viewComposite({
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
