import validationErrorInfo from "../utils/validation_error_info.js";

import deps from "../../deps.js";

export default (dwolla) => async (
  { firstName, lastName, email, businessName, ipAddress, correlationId },
  { idempotencyKey } = {}
) => {
  try {
    const {
      headers: { location },
    } = await dwolla.post(
      "customers",
      {
        firstName,
        lastName,
        email,
        ipAddress,
        ...(businessName && { businessName }),
        ...(correlationId && { correlationId }),
      },
      idempotencyKey && { "Idempotency-Key": idempotencyKey }
    );

    return location;
  } catch (err) {
    switch (err.statusCode) {
      case 400:
        switch (err.code) {
          case "ValidationError":
            throw deps.badRequestError.message(
              "Some information was missing when creating this account.",
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
          "You aren't allowed to create this customer.",
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
