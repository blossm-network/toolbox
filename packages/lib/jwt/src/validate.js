const { decodeJwt } = require("../deps");

const deps = require("../deps");

module.exports = async ({ token, verifyFn }) => {
  const [header, payload, signature] = token.split(".");

  const isVerified = await verifyFn({
    message: `${header}.${payload}`,
    signature
  });

  //eslint-disable-next-line
  console.log("isVerified: ", { isVerified, token });
  if (!isVerified) throw deps.invalidCredentialsError.tokenInvalid();

  return decodeJwt(token);
};
