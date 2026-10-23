import { write, forwardHeaders } from "@blossm/server";
import fact from "@blossm/fact-rpc";
import { badRequest } from "@blossm/errors";

export default {
  fact,
  write,
  forwardHeaders,
  badRequestError: badRequest,
};
