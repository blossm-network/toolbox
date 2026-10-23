import { nodeImage } from "../../../runtime.js";

export default ({ strict = true } = {}) => {
  return {
    name: nodeImage,
    entrypoint: strict ? "yarn" : "bash",
    args: strict
      ? ["test:integration"]
      : ["-c", "yarn test:integration || exit 0"],
  };
};
