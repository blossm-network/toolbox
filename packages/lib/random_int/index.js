import deps from "./deps.js";

export default ({ min, max }) => {
  if (min >= max) return null;
  return deps.randomInt(min, max);
};
