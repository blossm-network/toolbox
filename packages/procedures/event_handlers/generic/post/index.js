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

module.exports = ({ mainFn, streamFn }) => async (req, res) => {
  const { from, push = true } = data(req);

  await streamFn({
    from,
    fn: (event) => mainFn(event, { push }),
    // chronological by when the events were created, which best represents the events' intended order.
    //TODO test
    sortFn: (a, b) =>
      a.data.created < b.data.created
        ? -1
        : a.data.created > b.data.created
        ? 1
        : 0,
  });

  res.sendStatus(204);
};
