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
    const { root, forceNumber } = data(req);
    const nextEventNumber = await nextEventNumberFn({ root });

    await streamFn(
      { root, from: forceNumber != undefined ? forceNumber : nextEventNumber },
      async (event) => {
        if (event.headers.action == process.env.EVENT_ACTION)
          await mainFn(event);
        await incrementNextEventNumberFn({ root, from: event.headers.number });
      }
    );

    res.sendStatus(204);
  };
};
