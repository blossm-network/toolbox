const { badRequest } = require("@sustainers/errors");

const event = req => {
  try {
    const eventString = Buffer.from(req.body.message.data, "base64")
      .toString()
      .trim();
    return JSON.parse(eventString);
  } catch (e) {
    throw badRequest.badEvent;
  }
};

module.exports = ({ mainFn }) => {
  return async (req, res) => {
    if (!req.body) {
      throw badRequest.missingMessage;
    }
    if (!req.body.message) {
      throw badRequest.badMessage;
    }

    await mainFn(event(req));

    res.status(204).send();
  };
};
