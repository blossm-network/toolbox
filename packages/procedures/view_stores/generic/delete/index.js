import deps from "./deps.js";

export default (options) => async (req, res) => {
  const result = await deps.remove(options)({
    id: req.params.id,
    query: req.query.query,
    context: req.query.context,
  });
  res.status(200).send(result);
};
