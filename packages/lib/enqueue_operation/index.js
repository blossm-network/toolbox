import deps from "./deps.js";
import { MAX_LENGTH } from "@blossm/service-name-consts";

export default async ({ enqueueFn, url, data, operation, method }) =>
  enqueueFn({
    url,
    data,
    ...(method && { method }),
    hash: deps.hash(...operation),
    name: deps.trim(`${operation.slice().reverse().join("-")}`, MAX_LENGTH),
  });
