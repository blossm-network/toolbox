import deps from "./deps.js";

export default (options) => async (req, res) => {
  const result = await deps.write(options)({
    id: req.params.id,
    body: req.body,
  });
  if (!result) return res.sendStatus(204);
  res.status(200).send(result);
};
