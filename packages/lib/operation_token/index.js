import deps from "./deps.js";
import { MAX_LENGTH } from "@blossm/service-name-consts";

export default async ({ tokenFn, operationNameComponents }) =>
  tokenFn
    ? await tokenFn({
        hash: deps.hash(...operationNameComponents),
        name: deps.trim(`${operationNameComponents.slice().reverse().join("-")}`, MAX_LENGTH),
      })
    : null;
