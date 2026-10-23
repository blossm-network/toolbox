import deps from "../../deps.js";

export default (dwolla) =>
  async (id, { idempotencyKey } = {}) => {
    try {
      await dwolla.post(
        `customers/${id}/beneficial-ownership`,
        {
          status: "certified",
        },
        idempotencyKey && { "Idempotency-Key": idempotencyKey }
      );
    } catch (err) {
      switch (err.status) {
        case 404:
          throw deps.resourceNotFoundError.message(
            "This authority wasn't found.",
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
