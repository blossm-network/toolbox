import deps from "./deps.js";

export default ({ eventStore }) =>
  async (tx) => {
    const event = new eventStore({ tx });
    try {
      await event.validate(["tx"]);
    } catch (error) {
      throw deps.badRequestError.message("Invalid transaction metadata.", {
        cause: error,
      });
    }
    return event.toObject({ minimize: false }).tx;
  };
