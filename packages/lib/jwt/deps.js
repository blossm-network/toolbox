import {
  fineTimestamp,
  stringFromDate,
  string as dateString,
} from "@blossm/datetime";
import uuid from "@blossm/uuid";
import { invalidCredentials } from "@blossm/errors";
import { jwtDecode } from "jwt-decode";

export default {
  fineTimestamp,
  stringFromDate,
  dateString,
  uuid,
  decodeJwt: jwtDecode,
  invalidCredentialsError: invalidCredentials,
};
