import canonicalJson from "canonical-json";
import stableStringify from "fast-json-stable-stringify";

// Unmarked historical records use format 1, including its Boolean behavior.
export default (value, { canonicalFormat = 1 } = {}) => {
  switch (canonicalFormat) {
    case 1:
      return canonicalJson(value);
    case 2:
      return stableStringify(value);
    default:
      throw new Error(`Unsupported canonical format: ${canonicalFormat}`);
  }
};
