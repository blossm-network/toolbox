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
    let newSeenEventNumber;

    await streamFn({ root, from: number }, (event) => {
      //TODO
      //eslint-disable-next-line no-console
      console.log({ event, state });
      if (event.headers.action == process.env.EVENT_ACTION)
        state = mainFn(state, event);

      newSeenEventNumber = event.headers.number;
    });

    if (state) await commitFn(state);

    if (newSeenEventNumber != undefined)
      await saveNextEventNumberFn({ root, from: newSeenEventNumber });

    res.sendStatus(204);
  };
};
