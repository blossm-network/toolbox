const deps = require("./deps");

module.exports = ({ removeFn }) => async (req, res) => {
  //TODO
  console.log("AJFAWEJFAEWFAWJE:FAEWF");
  console.log({ query: req.query });
  console.log({ body: req.body });
  console.log({ params: req.params });
  if (!req.query.query)
    throw deps.badRequestError.message(
      "Missing query parameter in the url's query."
    );

  const formattedQueryBody = {};
  for (const key in req.query.query || {}) {
    formattedQueryBody[`body.${key}`] = req.query.query[key];
  }

  const { deletedCount } = await removeFn({
    ...formattedQueryBody,
    ...(req.query.context && {
      "headers.context.root": req.query.context.root,
      "headers.context.domain": req.query.context.domain,
      "headers.context.service": req.query.context.service,
      "headers.context.network": req.query.context.network,
    }),
  });

  res.status(200).send({ deletedCount });
};
