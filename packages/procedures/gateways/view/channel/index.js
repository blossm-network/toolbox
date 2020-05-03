module.exports = (req, res) => {
  const channel = `${req.query.name}${
    process.env.DOMAIN ? `.${process.env.DOMAIN}` : ""
  }${process.env.SERVICE ? `.${process.env.SERVICE}` : ""}.${
    process.env.CONTEXT
  }.${req.query.context[process.env.CONTEXT].root}.${
    req.query.context[process.env.CONTEXT].service
  }.${req.query.context[process.env.CONTEXT].network}`;

  res.status(200).send(channel);
};
