import crypto from "crypto";

export default ({ min, max }) => {
  if (min >= max) return null;
  return crypto.randomInt(min, max);
};
