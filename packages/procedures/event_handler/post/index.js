const deps = require("./deps");

const event = req => {
  try {
    const eventString = Buffer.from(req.body.message.data, "base64")
      .toString()
      .trim();
    return JSON.parse(eventString);
  } catch (e) {
    throw deps.badRequestError.badEvent();
  }
};

module.exports = ({ mainFn }) => {
  return async (req, res) => {
    if (!req.body) {
      throw deps.badRequestError.missingMessage();
    }
    if (!req.body.message) {
      throw deps.badRequestError.badMessage();
    }

    await mainFn(event(req));

    res.status(204).send();
  };
};
