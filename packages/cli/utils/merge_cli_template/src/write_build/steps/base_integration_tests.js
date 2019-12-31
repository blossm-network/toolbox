module.exports = ({ strict = true } = {}) => {
  return {
    name: "node:10.16.0",
    entrypoint: strict ? "yarn" : "bash",
    args: strict
      ? ["base-test:integration"]
      : ["-c", "yarn test:base-integration || exit 0"]
  };
};
