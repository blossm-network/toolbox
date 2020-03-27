module.exports = ({ extension, containerRegistery, procedure } = {}) => {
  return {
    name: "gcr.io/cloud-builders/docker",
    args: [
      "build",
      "-t",
      `${containerRegistery}/${procedure}.${extension}`,
      "."
    ]
  };
};
