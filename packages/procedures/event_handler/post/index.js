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
  aggregateStreamFn,
  aggregateFn,
  readFactFn,
}) => async (req, res) => {
  const { timestamp, action, domain, service, push = true } = req.body.message
    ? data(req)
    : { push: false };

  await aggregateStreamFn({
    ...(timestamp && { updatedOnOrAfter: timestamp }),
    ...(action && { action }),
    ...(domain && { domain }),
    ...(service && { service }),
    //TODO test and see if theres a way to get the aggregates to come in reverse cron order.
    fn: (aggregate) =>
      mainFn({
        aggregate,
        aggregateFn,
        readFactFn,
        push,
        ...(action && { action }),
      }),
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
