import validator from "@blossm/validator";
import { MILLISECONDS_IN_HOUR } from "@blossm/duration-consts";

import deps from "./deps.js";

export default async (params) => {
  const error = validator.findError([
    validator.object(params.headers, { title: "headers", path: "headers" }),
    validator.object(params.payload, {
      optional: true,
      title: "payload",
      path: "payload",
    }),
    validator.string(params.root, {
      optional: true,
      title: "root",
      path: "root",
    }),
  ]);

  if (error) throw error;

  const headersError = validator.findError([
    validator.string(params.headers.idempotency, {
      optional: true,
      title: "idempotency",
      path: "headers.idempotency",
    }),
    validator.date(params.headers.issued, {
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
