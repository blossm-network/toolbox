const deps = require("./deps");

const event = (req) => {
  try {
    const eventString = Buffer.from(req.body.message.data, "base64")
      .toString()
      .trim();
    return JSON.parse(eventString);
  } catch (e) {
    //TODO write a test for this.
    throw deps.badRequestError.message("Invalid event format.");
  }
};

module.exports = ({ mainFn }) => {
  return async (req, res) => {
    await mainFn(event(req));

    res.status(204).send();
  };
};
