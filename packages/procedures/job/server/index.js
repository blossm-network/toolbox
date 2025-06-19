import deps from "./deps.js";

export default async ({ mainFn } = {}) =>
  deps.server().post(deps.post({ mainFn })).listen();
