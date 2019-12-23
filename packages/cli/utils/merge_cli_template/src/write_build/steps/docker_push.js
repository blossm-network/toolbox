module.exports = ({ extension, containerRegistery, service, context } = {}) => {
  return {
    name: "gcr.io/cloud-builders/docker",
    args: ["push", `${containerRegistery}/${service}.${context}.${extension}`]
  };
};
