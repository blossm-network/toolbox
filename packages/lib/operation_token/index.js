import deps from "./deps.js";

export default async ({ tokenFn, operationNameComponents }) =>
  tokenFn
    ? await tokenFn({
        hash: deps.hash(...operationNameComponents),
        name: deps.operationShortName(operationNameComponents)
      })
    : null;
