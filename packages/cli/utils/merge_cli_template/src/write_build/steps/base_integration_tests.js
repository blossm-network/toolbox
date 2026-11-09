import { nodeImage } from "../../../runtime.js";

export default ({ strict = true } = {}) => {
  return {
    name: nodeImage,
    entrypoint: strict ? "yarn" : "bash",
    args: strict
      ? ["test:base-integration"]
      : ["-c", "yarn test:base-integration || exit 0"],
  };
};
