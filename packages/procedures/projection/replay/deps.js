import { createHash } from "node:crypto";
import { badRequest } from "@blossm/errors";

export default { createHash, badRequestError: badRequest };
