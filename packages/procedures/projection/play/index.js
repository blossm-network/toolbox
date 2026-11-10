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
  }) =>
  async (req, res) => {
    const { root, action, domain, service, hash } = req.body.message
      ? data(req)
      : { ...req.body, action: undefined };

    if (!root) throw deps.badRequestError.message("A root wasn't specified.");

    const push =
      action != undefined &&
      !mutedEvents.some(
        (e) =>
          e.service == service &&
          e.domain == domain &&
          e.actions.includes(action),
      );

    const run = async (session) => {
      const aggregate = await aggregateFn({ root, domain, service });
      await mainFn({
        aggregate,
        aggregateFn,
        readFactFn,
        push,
        ...(action && { action }),
        ...(session && { session }),
      });
    };
    if (sessionFn) {
      if (
        req.body.message &&
        (typeof hash != "string" ||
          !hash ||
          typeof req.body.subscription != "string" ||
          !req.body.subscription)
      )
        throw deps.badRequestError.message(
          "A stable event hash and subscription are required.",
        );
      const playId = req.body.message
        ? JSON.stringify(["pubsub", req.body.subscription, hash])
        : req.body.playId ||
          (req.headers && req.headers["x-cloudtasks-taskname"]);
      await sessionFn({ playId, run });
    } else {
      await run();
    }

    res.sendStatus(204);
  };
