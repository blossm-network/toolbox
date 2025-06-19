import validationErrorInfo from "../utils/validation_error_info.js";

import deps from "../../deps.js";

export default (dwolla) => async (
  id,
  { data, filename, contentType, knownLength },
  { type },
  { idempotencyKey } = {}
) => {
  try {
    const body = new deps.FormData();

    body.append("file", Buffer.from(data), {
      filename,
      contentType,
      knownLength,
    });

    body.append("documentType", type);

    const { headers } = await dwolla.post(
      `customers/${id}/documents`,
      body,
      idempotencyKey && { "Idempotency-Key": idempotencyKey }
    );

    return headers.get("location");
  } catch (err) {
    switch (err.statusCode) {
      case 400:
        switch (err.code) {
          case "ValidationError":
            throw deps.badRequestError.message(
              "Some information was missing when creating a document for this customer.",
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
          "You aren't allowed to create a document for this customer.",
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
