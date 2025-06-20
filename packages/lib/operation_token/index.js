import deps from "./deps.js";
import { MAX_LENGTH } from "@blossm/service-name-consts";

export default async ({ tokenFn, operation }) =>
  tokenFn
    ? await tokenFn({
        hash: deps.hash(...operation),
        name: deps.trim(`${operation.slice().reverse().join("-")}`, MAX_LENGTH),
      })
    : null;
