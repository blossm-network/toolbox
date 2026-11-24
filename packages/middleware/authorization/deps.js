import authorize from "@blossm/authorize";
import { invalidCredentials } from "@blossm/errors";

export default {
  authorize,
  invalidCredentialsError: invalidCredentials,
};
