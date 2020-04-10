module.exports = ({ id, secret }) =>
  Buffer.from(`${id}:${secret}`).toString("base64");
