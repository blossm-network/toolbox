const deps = require("./deps");

const data = (req) => {
  try {
    const dataString = Buffer.from(req.body.message.data, "base64")
      .toString()
      .trim();
    return JSON.parse(dataString);
  } catch (e) {
    //TODO write a test for this.
    throw deps.badRequestError.message("Invalid data format.");
  }
};

module.exports = ({
  mainFn,
  streamFn,
  nextEventNumberFn,
  incrementNextEventNumberFn,
}) => {
  return async (req, res) => {
    const { from, root, force = false } = data(req);
    const nextEvent = await nextEventNumberFn({ root });

    if (!force && nextEvent != from)
      throw deps.preconditionFailedError.message(
        "The event was received out of order."
      );

    await streamFn({ root, from }, async (event) => {
      await mainFn(event);
      await incrementNextEventNumberFn({ root, from: event.headers.number });
    });

    res.sendStatus(204);
  };
};
