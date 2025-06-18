import deps from "./deps.js";
import serviceNameConsts from "@blossm/service-name-consts";

const { MAX_LENGTH } = serviceNameConsts;

export default async ({ tokenFn, operation }) =>
  tokenFn
    ? await tokenFn({
        hash: deps.hash(...operation),
        name: deps.trim(`${operation.slice().reverse().join("-")}`, MAX_LENGTH),
      })
    : null;
