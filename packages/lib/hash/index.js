import keccak from "keccak";

import deps from "./deps.js";

const update = (value, { hash } = {}) => {
  const newHash = (hash || keccak("keccak256")).update(
    deps.cononicalString(value)
  );
  return {
    update: (value) => update(value, { hash: newHash }),
    create: () => newHash.digest("hex"),
  };
};

export default update;
