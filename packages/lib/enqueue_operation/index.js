import deps from "./deps.js";
import serviceNameConsts from "@blossm/service-name-consts";

const { MAX_LENGTH } = serviceNameConsts;

export default async ({ enqueueFn, url, data, operation, method }) =>
  enqueueFn({
    url,
    data,
    ...(method && { method }),
    hash: deps.hash(...operation),
    name: deps.trim(`${operation.slice().reverse().join("-")}`, MAX_LENGTH),
  });
