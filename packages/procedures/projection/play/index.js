import deps from "./deps.js";

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

export default ({
  mainFn,
  aggregateFn,
  readFactFn,
  mutedEvents = [],
  sessionFn,
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

  const run = async (session) => {
    const aggregate = await aggregateFn({ root, domain, service });
    await mainFn({
      aggregate, aggregateFn, readFactFn, push,
      ...(action && { action }),
      ...(session && { session }),
    });
  };
  if (sessionFn) {
    const playId = req.body.message
      ? req.body.message.messageId && `pubsub:${req.body.subscription || ""}:${req.body.message.messageId}`
      : req.body.playId || (req.headers && req.headers["x-cloudtasks-taskname"]);
    await sessionFn({ playId, run });
  } else {
    await run();
  }

  res.sendStatus(204);
};
