const deps = require("./deps");

const data = (req) => {
  try {
    const dataString = Buffer.from(req.body.message.data, "base64")
      .toString()
      .trim();
    return JSON.parse(dataString);
  } catch (e) {
    throw deps.badRequestError.message("Invalid data format.");
  }
};

module.exports = ({
  mainFn,
  commitFn,
  streamFn,
  nextEventNumberFn,
  saveNextEventNumberFn,
}) => {
  return async (req, res) => {
    const {
      root,
      forceFrom: number = await nextEventNumberFn({ root }),
    } = data(req);

    let state;

    await streamFn({ root, from: number }, (event) => {
      if (event.headers.action == process.env.EVENT_ACTION)
        state = mainFn(state, event);
    });

    if (state) {
      await commitFn(state);
      await saveNextEventNumberFn({ root, from: state.headers.number });
    }

    res.sendStatus(204);
  };
};
