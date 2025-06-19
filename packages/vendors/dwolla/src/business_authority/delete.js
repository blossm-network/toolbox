import deps from "../../deps.js";

export default (dwolla) => async (id, { idempotencyKey } = {}) => {
  try {
    const { body } = await dwolla.delete(
      `beneficial-owners/${id}`,
      {},
      idempotencyKey && { "Idempotency-Key": idempotencyKey }
    );

    return body;
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
