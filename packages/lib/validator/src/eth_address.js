import { string as stringValidator } from "@blossm/validation";
import { isValidChecksumAddress } from "ethereumjs-util";

export default (
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
