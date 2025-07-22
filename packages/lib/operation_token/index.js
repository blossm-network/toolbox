import deps from "./deps.js";

export default async ({ tokenFn, operationNameComponents, hash }) =>
  tokenFn
    ? await tokenFn({
        hash,
        name: deps.operationShortName(operationNameComponents)
      })
    : null;
