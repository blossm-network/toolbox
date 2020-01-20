const { decodeJwt } = require("../deps");

const deps = require("../deps");

module.exports = async ({ token, verifyFn }) => {
  const [header, payload, signature] = token.split(".");

  const isVerified = await verifyFn({
    message: `${header}.${payload}`,
    signature
  });

  //eslint-disable-next-line
  console.log("HERE 2: ", !isVerified);
  if (!isVerified) throw deps.invalidCredentialsError.tokenInvalid();

  //eslint-disable-next-line
  console.log("decoded: ", decodeJwt(token));
  return decodeJwt(token);
};
