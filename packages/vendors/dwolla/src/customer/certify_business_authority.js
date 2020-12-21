const deps = require("../../deps");

module.exports = (dwolla) => async (id, { idempotencyKey } = {}) => {
  try {
    await dwolla.post(
      `customers/${id}/beneficial-ownership`,
      {
        status: "certified",
      },
      idempotencyKey && { "Idempotency-Key": idempotencyKey }
    );
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
