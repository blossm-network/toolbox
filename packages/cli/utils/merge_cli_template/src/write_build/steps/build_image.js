module.exports = ({ extension, containerRegistery, service, context } = {}) => {
  return {
    name: "gcr.io/cloud-builders/docker",
    args: [
      "build",
      "-t",
      `${containerRegistery}/${service}.${extension}.${context}`,
      "."
    ]
  };
};
