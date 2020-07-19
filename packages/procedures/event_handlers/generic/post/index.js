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

module.exports = ({ mainFn, streamFn }) => async (req, res) => {
  const { from, push = true } = data(req);

  await streamFn({
    from,
    fn: (event) => mainFn(event, { push }),
    // chronological
    sortFn: (a, b) =>
      a.data.saved < b.data.saved ? -1 : a.data.saved > b.data.saved ? 1 : 0,
  });

  res.sendStatus(204);
};
