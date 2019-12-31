module.exports = ({ strict = true } = {}) => {
  return {
    name: "node:10.16.0",
    entrypoint: strict ? "yarn" : "bash",
    args: strict
      ? ["test:integration"]
      : ["-c", "yarn test:integration || exit 0"]
  };
};
