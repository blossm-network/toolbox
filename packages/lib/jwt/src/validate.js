const { verify } = require("jsonwebtoken");
const { unauthorized } = require("@sustainer-network/errors");

module.exports = async ({ token, secret }) => {
  try {
    const decodedObject = await verify(token, secret);
    return decodedObject;
  } catch (err) {
    const isExpired = err.name == "TokenExpiredError";
    const error = isExpired
      ? unauthorized.tokenExpired
      : unauthorized.tokenInvalid;
    throw error;
  }
};
