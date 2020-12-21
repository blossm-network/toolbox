const validationErrorInfo = require("../utils/validation_error_info");

const deps = require("../../deps");

module.exports = (dwolla) => async (
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
  },
  { idempotencyKey } = {}
) => {
  try {
    const { body } = await dwolla.post(
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
        throw deps.badRequestError.message("This customer couldn't be made.", {
          info: { errors: [{ message: err.message }] },
          source: err,
        });
    }
  }
};
