import { badRequest, forbidden, resourceNotFound } from "@blossm/errors";
import Client from "dwolla-v2";
import FormData from "form-data";

const dwolla = (key, secret, { environment }) => {
  return new Client({
    key,
    secret,
    environment,
  });
};

export default {
  dwolla,
  badRequestError: badRequest,
  forbiddenError: forbidden,
  resourceNotFoundError: resourceNotFound,
  FormData,
};
