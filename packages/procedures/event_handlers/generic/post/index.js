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
    //TODO
    //eslint-disable-next-line no-console
    console.log("HEY");
    const { root, forceNumber } = data(req);
    //TODO
    //eslint-disable-next-line no-console
    console.log({ root, forceNumber, nextEventNumberFn });
    const nextEventNumber = await nextEventNumberFn({ root });

    //TODO
    //eslint-disable-next-line no-console
    console.log({ nextEventNumber });
    await streamFn(
      { root, from: forceNumber != undefined ? forceNumber : nextEventNumber },
      async (event) => {
        //TODO
        //eslint-disable-next-line no-console
        console.log("found event: ", { event });

        // // lock will exist and equal event.headers.number if its allowed.
        // const lock = await lockNextEventNumberFn({
        //   root,
        //   from: event.headers.number,
        // });

        // if (lock == undefined) return;

        //TODO
        //eslint-disable-next-line no-console
        console.log(" equal: ", {
          eveAction: event.headers.action,
          envAction: process.env.EVENT_ACTION,
        });
        if (event.headers.action == process.env.EVENT_ACTION)
          await mainFn(event);
        //TODO
        //eslint-disable-next-line no-console
        console.log("amin done");
        await incrementNextEventNumberFn({ root, from: event.headers.number });
        //TODO
        //eslint-disable-next-line no-console
        console.log("incremented");
      }
    );

    //TODO
    //eslint-disable-next-line no-console
    console.log("swag");
    res.sendStatus(204);
  };
};
