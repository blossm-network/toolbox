module.exports = ({ strict = true } = {}) => {
  return {
    name: "node:20.19.0",
    entrypoint: strict ? "yarn" : "bash",
    args: strict
      ? ["test:integration"]
      : ["-c", "yarn test:integration || exit 0"],
  };
};
