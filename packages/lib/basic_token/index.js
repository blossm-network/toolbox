module.exports = ({ root, secret }) => ({
  token: Buffer.from(`${root}:${secret}`).toString("base64"),
  type: "Basic",
});
