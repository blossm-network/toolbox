export default ({ extension, containerRegistery, procedure } = {}) => {
  return {
    name: "gcr.io/cloud-builders/docker",
    args: [
      "push",
      `${containerRegistery}/${procedure}${extension ? `.${extension}` : ""}`,
    ],
  };
};
