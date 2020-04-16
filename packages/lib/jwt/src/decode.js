const { decodeJwt } = require("../deps");

module.exports = (token) => {
  const headers = decodeJwt(token, { header: true });
  const claims = decodeJwt(token);
  return { headers, claims };
};
