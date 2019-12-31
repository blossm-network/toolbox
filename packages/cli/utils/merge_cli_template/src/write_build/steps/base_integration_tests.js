module.exports = ({ strict = true } = {}) => {
  return {
    name: "node:10.16.0",
    entrypoint: strict ? "yarn" : "bash",
    args: strict
      ? ["test:base-integration"]
      : ["-c", "yarn test:base-integration || exit 0"]
  };
};
