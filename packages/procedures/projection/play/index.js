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
  aggregateFn,
  readFactFn,
  mutedEvents = [],
}) => async (req, res) => {
  const { root, action, domain, service } = req.body.message
    ? data(req)
    : { ...req.body, action: undefined };

  if (!root) throw deps.badRequestError.message("A root wasn't specified.");

  const push =
    action != undefined &&
    !mutedEvents.some(
      (e) =>
        e.service == service && e.domain == domain && e.actions.includes(action)
    );

  const aggregate = await aggregateFn({
    root,
    domain,
    service,
  });

  await mainFn({
    aggregate,
    aggregateFn,
    readFactFn,
    push,
    ...(action && { action }),
  });

  res.sendStatus(204);
};
