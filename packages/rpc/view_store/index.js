import deps from "./deps.js";

export default ({ name, context = process.env.CONTEXT, region = process.env.REGION, network }) => {
  const internal = !network || network == process.env.NETWORK;
  const read = ({
    contexts,
    currentToken,
    token: { internalFn: internalTokenFn, externalFn: externalTokenFn } = {},
  } = {}) => ({
    query,
    sort,
    download,
    text,
    id,
    skip,
    limit,
    bootstrap,
  } = {}) =>
    deps
      .rpc({region, operationNameComponents: [name, ...(context ? [context] : []), "view-store"]})
      .get({
        ...(query && { query }),
        ...(text && { text }),
        ...(skip && { skip }),
        ...(limit && { limit }),
        ...(bootstrap && { bootstrap }),
        ...(sort && { sort }),
        ...(download && { download }),
        ...(id && { id }),
      })
      .in({
        ...(contexts && { context: contexts }),
        ...(!internal && {
          network,
          host: `v${context ? `.${context}` : ""}.${network}`,
        }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(currentToken && { currentToken }),
        ...(!internal && { path: `/${name}` }),
      });
  const idStream = ({
    contexts,
    currentToken,
    token: { internalFn: internalTokenFn, externalFn: externalTokenFn } = {},
  } = {}) => (fn, { query, sort, parallel } = {}) =>
    deps
      .rpc({region, operationNameComponents: [name, ...(context ? [context] : []), "view-store"]})
      .stream(fn, {
        ...(query && { query }),
        ...(sort && { sort }),
        ...(parallel && { parallel }),
      })
      .in({
        ...(contexts && { context: contexts }),
        ...(!internal && {
          network,
          host: `v${context ? `.${context}` : ""}.${network}`,
        }),
      })
      .with({
        path: `/${internal ? "" : `${name}/`}stream-ids`,
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(currentToken && { currentToken }),
      });
  const update = ({
    contexts,
    token: { internalFn: internalTokenFn } = {},
    enqueue: { fn: enqueueFn, wait: enqueueWait } = {},
  } = {}) => ({ id, query, update, groups, trace, arrayFilters }) =>
    deps
      .rpc({region, operationNameComponents: [name, ...(context ? [context] : []), "view-store"]})
      .put(id, {
        ...(trace && { trace }),
        ...(query && { query }),
        ...(groups && { groups }),
        ...(arrayFilters && { arrayFilters }),
        update,
      })
      .in({
        ...(contexts && { context: contexts }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(enqueueFn && {
          enqueueFn: enqueueFn({
            queue: `view-store${context ? `-${context}` : ""}-${name}`,
            ...(enqueueWait && { wait: enqueueWait }),
          }),
        }),
      });
  const del = ({
    contexts,
    token: { internalFn: internalTokenFn } = {},
  } = {}) => (id, { query } = {}) =>
    deps
      .rpc({region, operationNameComponents: [name, ...(context ? [context] : []), "view-store"]})
      .delete(id, {
        ...(query && { query }),
      })
      .in({
        ...(contexts && { context: contexts }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
      });
  return {
    set: ({ context: contexts, token, currentToken, enqueue }) => {
      return {
        read: read({ contexts, token, currentToken }),
        idStream: idStream({ contexts, token, currentToken }),
        update: update({ contexts, token, enqueue }),
        delete: del({ contexts, token }),
      };
    },
    read: read(),
    idStream: idStream(),
    update: update(),
    delete: del(),
  };
};
