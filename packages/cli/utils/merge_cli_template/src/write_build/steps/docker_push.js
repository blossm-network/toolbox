module.exports = ({
  extension,
  containerRegistery,
  service,
  procedure
} = {}) => {
  return {
    name: "gcr.io/cloud-builders/docker",
    args: ["push", `${containerRegistery}/${service}.${procedure}.${extension}`]
  };
};
