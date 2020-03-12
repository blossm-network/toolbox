module.exports = ({
  extension,
  containerRegistery,
  service,
  procedure
} = {}) => {
  return {
    name: "gcr.io/cloud-builders/docker",
    args: [
      "build",
      "-t",
      `${containerRegistery}/${service}.${procedure}.${extension}`,
      "."
    ]
  };
};
