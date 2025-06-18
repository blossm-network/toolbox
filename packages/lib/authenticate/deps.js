import { validate } from "@blossm/jwt";
import { invalidCredentials } from "@blossm/errors";

export default {
  validate,
  invalidCredentialsError: invalidCredentials
};
