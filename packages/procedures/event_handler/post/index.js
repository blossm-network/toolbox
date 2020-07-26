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

module.exports = ({ mainFn, aggregateStreamFn }) => async (req, res) => {
  const { timestamp, push = false } = data(req);

  await aggregateStreamFn({
    ...(timestamp && { timestamp }),
    fn: (aggregate) => mainFn(aggregate, { push }),
    // chronological by when the events were created, which best represents the events' intended order.
    sortFn: (a, b) =>
      a.headers.created < b.headers.created
        ? -1
        : a.headers.created > b.headers.created
        ? 1
        : 0,
  });

  res.sendStatus(204);
};
