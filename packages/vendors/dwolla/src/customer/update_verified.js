import validationErrorInfo from "../utils/validation_error_info.js";

import deps from "../../deps.js";

export default (dwolla) => async (
  id,
  {
    email,
    ipAddress,
    address1,
    address2,
    city,
    state,
    postalCode,
    website,
    phone,
  },
  { idempotencyKey } = {}
) => {
  try {
    const { body } = await dwolla.post(
      `customers/${id}`,
      {
        ...(email && { email }),
        ...(ipAddress && { ipAddress }),
        ...(address1 && { address1 }),
        ...(address2 && { address2 }),
        ...(city && { city }),
        ...(state && { state }),
        ...(postalCode && { postalCode }),
        ...(website && { website }),
        ...(phone && { phone }),
      },
      idempotencyKey && { "Idempotency-Key": idempotencyKey }
    );

    return body;
  } catch (err) {
    switch (err.statusCode) {
      case 400:
        switch (err.code) {
          case "ValidationError":
            throw deps.badRequestError.message(
              "Some information was missing when updating this customer.",
              {
                info: validationErrorInfo(err),
                source: err,
              }
            );
          default:
            throw deps.badRequestError.message(
              "This customer couldn't be made.",
              {
                info: { errors: [{ message: err.message }] },
                source: err,
              }
            );
        }
      case 403:
        throw deps.forbiddenError.message(
          "You aren't allowed to update this account.",
          {
            info: { errors: [{ message: err.message }] },
            source: err,
          }
        );
      default:
        throw deps.badRequestError.message("This customer couldn't be made.", {
          info: { errors: [{ message: err.message }] },
          source: err,
        });
    }
  }
};
