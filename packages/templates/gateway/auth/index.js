const deps = require("./deps");
const gcpToken = require("@sustainers/gcp-token");

module.exports = () => {
  return async (req, res) => {
    const { token } = deps
      .command({
        action: "create",
        domain: "auth-token",
        service: process.env.SERVICE,
        network: process.env.NETWORK
      })
      .issue({ payload: {}, headers: {} })
      .in()
      .with(gcpToken);
    res
      .cookie(`${process.env.SERVICE}-session`, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV != "local"
      })
      .status(204)
      .send();
  };
};
