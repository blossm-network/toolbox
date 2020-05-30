module.exports = ({ root, secret }) => {
  return {
    token: Buffer.from(`${root}:${secret}`).toString("base64"),
    type: "Basic",
  };
};
