const deps = require("../../deps");

module.exports = (dwolla) => async (id) => {
  try {
    const {
      body: {
        firstName,
        lastName,
        address: {
          address1,
          address2,
          city,
          stateProvinceRegion: state,
          country,
          postalCode,
        },
        verificationStatus,
      },
    } = await dwolla.get(`beneficial-owners/${id}`, {});

    return {
      firstName,
      lastName,
      address: {
        address1,
        address2,
        city,
        state,
        country,
        postalCode,
      },
      verificationStatusType: verificationStatus,
    };
  } catch (err) {
    switch (err.statusCode) {
      case 404:
        throw deps.resourceNotFoundError.message(
          "This authority wasn't found.",
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
