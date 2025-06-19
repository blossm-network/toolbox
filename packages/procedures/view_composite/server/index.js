import deps from "./deps.js";

export default async ({ mainFn, viewsFn } = {}) =>
  deps.server().get(deps.get({ mainFn, viewsFn })).listen();
