import deps from "../../deps.js";

export default (dwolla) => async (id) => {
  try {
    const {
      body: { status },
    } = await dwolla.get(`customers/${id}/beneficial-ownership`, {});

    return {
      status,
    };
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
