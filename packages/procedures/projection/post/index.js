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
  //TODO
  console.log("posting");
  const { timestamp, root, action, domain, service, push = true } = req.body
    .message
    ? data(req)
    : { push: false };

  //TODO
  console.log({ timestamp, root, action, domain, service, push });
  await aggregateStreamFn({
    ...(timestamp && { updatedOnOrAfter: timestamp }),
    ...(root && { root }),
    ...(action && { action }),
    ...(domain && { domain }),
    ...(service && { service }),
    fn: (aggregate) =>
      mainFn({
        aggregate,
        aggregateFn,
        readFactFn,
        push,
        ...(action && { action }),
      }),
  });

  res.sendStatus(204);
};
