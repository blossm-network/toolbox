import { object, string, date, findError } from "@blossm/validator";
import durationConsts from "@blossm/duration-consts";

const { MILLISECONDS_IN_HOUR } = durationConsts;

import deps from "./deps.js";

export default async (params) => {
  const error = findError([
    object(params.headers, { title: "headers", path: "headers" }),
    object(params.payload, {
      optional: true,
      title: "payload",
      path: "payload",
    }),
    string(params.root, {
      optional: true,
      title: "root",
      path: "root",
    }),
  ]);

  if (error) throw error;

  const headersError = findError([
    string(params.headers.idempotency, {
      optional: true,
      title: "idempotency",
      path: "headers.idempotency",
    }),
    date(params.headers.issued, {
      title: "issued date",
      headers: "headers.issued",
    }),
  ]);

  if (headersError) throw headersError;

  if (
    new Date(params.headers.issued).getTime() - new Date().getTime() >
    MILLISECONDS_IN_HOUR
  ) {
    throw deps.badRequestError.message("The issued timestamp seems incorrect.");
  }
};
