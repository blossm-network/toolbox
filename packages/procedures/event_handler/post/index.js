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
  console.log({ body: req.body });
  const { timestamp, action, domain, service, push = true } = req.body.message
    ? data(req)
    : { push: false };

  //TODO
  console.log({
    ...(timestamp && { updatedOnOrAfter: timestamp }),
    ...(action && { action }),
    ...(domain && { domain }),
    ...(service && { service }),
  });
  await aggregateStreamFn({
    ...(timestamp && { updatedOnOrAfter: timestamp }),
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
