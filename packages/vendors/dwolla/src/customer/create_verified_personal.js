import validationErrorInfo from "../utils/validation_error_info.js";

import deps from "../../deps.js";

export default (dwolla) =>
  async (
    {
      firstName,
      lastName,
      email,
      ipAddress,
      dateOfBirth,
      ssn,
      address1,
      address2,
      city,
      state,
      postalCode,
      phone,
      correlationId,
    },
    { idempotencyKey } = {}
  ) => {
    try {
      const { headers } = await dwolla.post(
        "customers",
        {
          firstName,
          lastName,
          email,
          ipAddress,
          type: "personal",
          dateOfBirth,
          ssn,
          address1,
          ...(address2 && { address2 }),
          city,
          state,
          postalCode,
          ...(phone && { phone }),
          ...(correlationId && { correlationId }),
        },
        idempotencyKey && { "Idempotency-Key": idempotencyKey }
      );

      return headers.get("location");
    } catch (err) {
      switch (err.status) {
        case 400:
          switch (err.body && err.body.code) {
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
            "You aren't allowed to create this account.",
            {
              info: { errors: [{ message: err.message }] },
              source: err,
            }
          );
        default:
          throw err;
      }
    }
  };
