import keccak from "keccak";

import deps from "./deps.js";

const update = (value, { hash, canonicalFormat } = {}) => {
  const newHash = (hash || keccak("keccak256")).update(
    typeof value == "object" || canonicalFormat == 2
      ? deps.cononicalString(value, { canonicalFormat })
      : value
  );
  return {
    update: (value) => update(value, { hash: newHash, canonicalFormat }),
    create: () => newHash.digest("hex"),
  };
};

export default update;
