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
      "build",
      "-t",
      `us.gcr.io/${project}${envNameSpecifier}/${service}.${context}${
        extension ? `.${extension}` : ""
      }`,
      "."
    ]
  };
};
