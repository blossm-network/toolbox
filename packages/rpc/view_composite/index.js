import deps from "./deps.js";

export default ({ name, context = process.env.CONTEXT, region = process.env.REGION }) => {
  const read = ({
    contexts,
    currentToken,
    token: { internalFn: internalTokenFn, externalFn: externalTokenFn } = {},
  } = {}) => ({ query, sort, root }) =>
    deps
      .rpc({region, operationNameComponents: [name, context, "view-composite"] })
      .get({ query, ...(sort && { sort }), ...(root && { id: root }) })
      .in({
        ...(contexts && { context: contexts }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(currentToken && { currentToken }),
      });
  // const stream = ({
  //   contexts,
  //   currentToken,
  //   token: {
  //     internalFn: internalTokenFn,
  //     externalFn: externalTokenFn,
  //     key,
  //   } = {},
  // } = {}) => async (fn, { query, sort, root }) =>
  //   await deps
  //     .rpc(
  //       name,
  //       ...(domain ? [domain] : []),
  //       ...(service ? [service] : []),
  //       context,
  //       "view-composite"
  //     )
  //     .stream(fn, { query, ...(sort && { sort }), ...(root && { id: root }) })
  //     .in({
  //       ...(contexts && { context: contexts }),
  //     })
  //     .with({
  //       path: `/stream`,
  //       ...(internalTokenFn && { internalTokenFn }),
  //       ...(externalTokenFn && { externalTokenFn }),
  //       ...(currentToken && { currentToken }),
  //       ...(key && { key }),
  //     });
  return {
    set: ({ context: contexts, token, currentToken }) => {
      return {
        read: read({ contexts, token, currentToken }),
        // stream: stream({ contexts, token, currentToken }),
      };
    },
    read: read(),
    // stream: stream(),
  };
};
