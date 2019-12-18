module.exports = ({
  extension,
  project,
  envNameSpecifier,
  service,
  context
} = {}) => {
  return {
    name: "gcr.io/cloud-builders/docker",
    args: [
      "push",
      `us.gcr.io/${project}${envNameSpecifier}/${service}.${context}${
        extension ? `.${extension}` : ""
      }`
    ]
  };
};
