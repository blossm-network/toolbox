import validationErrorInfo from "../utils/validation_error_info.js";

import deps from "../../deps.js";

export default (dwolla) => async (
  sustainerId,
  {
    firstName,
    lastName,
    ssn,
    dateOfBirth,
    address: { address1, address2, city, state, country, postalCode },
    passport: { number: passportNumber, country: passportCountry } = {},
  },
  { idempotencyKey } = {}
) => {
  try {
    const { headers } = await dwolla.post(
      `customers/${sustainerId}/beneficial-owners`,
      {
        firstName,
        lastName,
        ssn,
        dateOfBirth,
        address: {
          address1,
          ...(address2 && { address2 }),
          city,
          stateProvinceRegion: state,
          country,
          postalCode,
        },
        ...(passportNumber &&
          passportCountry && {
            passport: {
              number: passportNumber,
              country: passportCountry,
            },
          }),
      },
      idempotencyKey && { "Idempotency-Key": idempotencyKey }
    );

    return headers.get("location");
  } catch (err) {
    switch (err.statusCode) {
      case 400:
        switch (err.code) {
          case "ValidationError":
            throw deps.badRequestError.message(
              "Some information was missing when creating this authority.",
              {
                info: validationErrorInfo(err),
                source: err,
              }
            );
          default:
            throw deps.badRequestError.message(
              "This authority couldn't be made.",
              {
                info: { errors: [{ message: err.message }] },
                source: err,
              }
            );
        }
      case 403:
        throw deps.forbiddenError.message(
          "You aren't allowed to create this authority.",
          {
            info: { errors: [{ message: err.message }] },
            source: err,
          }
        );
      default:
        throw deps.badRequestError.message("This authority couldn't be made.", {
          info: { errors: [{ message: err.message }] },
          source: err,
        });
    }
  }
};
