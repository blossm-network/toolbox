module.exports = ({
  extension,
  project,
  envNameSpecifier,
  service,
  context
} = {}) => {
  return {
    name: "docker/compose:1.15.0",
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
