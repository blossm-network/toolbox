const { string: stringValidator } = require("@blossm/validation");
const { isValidChecksumAddress } = require("ethereumjs-util");

module.exports = (
  value,
  { baseMessageFn, title = "ethereum address", path, optional } = {}
) =>
  stringValidator({
    value,
    baseMessageFn,
    title,
    path,
    refinementMessageFn: (_, title) =>
      `This ${title.toLowerCase()} isn't formatted right`,
    refinementFn: (address) => {
      const valid = isValidChecksumAddress(address);
      if (!valid) throw `${address} is not a valid Ethereum address.`;
    },
    optional,
  });
