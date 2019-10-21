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
      .set({ tokenFn: gcpToken })
      .issue({ payload: {}, headers: {} });
    res
      .cookie(`${process.env.SERVICE}-session`, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV != "local"
      })
      .status(204)
      .send();
  };
};
