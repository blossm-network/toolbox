module.exports = ({ id, secret }) => {
  return {
    token: Buffer.from(`${id}:${secret}`).toString("base64"),
    type: "Basic",
  };
};
