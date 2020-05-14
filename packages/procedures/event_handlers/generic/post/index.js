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

    //TODO
    //eslint-disable-next-line no-console
    console.log("A");

    // TODO write a better test for this. idk a way to do it quickly.
    await streamFn({ root, from: number }, (event) => {
      //TODO
      //eslint-disable-next-line no-console
      console.log("C");
      state = mainFn(state, event);
      newSeenEventNumber = event.headers.number;
      //TODO
      //eslint-disable-next-line no-console
      console.log("C2");
    });

    //TODO
    //eslint-disable-next-line no-console
    console.log("B");
    if (state) await commitFn(state);

    if (newSeenEventNumber != undefined)
      await saveNextEventNumberFn({ root, from: newSeenEventNumber });

    res.sendStatus(204);
  };
};
