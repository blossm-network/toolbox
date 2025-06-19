export default ({ strict = true } = {}) => {
  return {
    name: "node:20.19.0",
    entrypoint: strict ? "yarn" : "bash",
    args: strict
      ? ["test:base-integration"]
      : ["-c", "yarn test:base-integration || exit 0"],
  };
};
