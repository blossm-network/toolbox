module.exports = {
  "some-service": {
    "some-domain": ({ state, root }) => {
      //eslint-disable-next-line no-console
      console.log({ state, root });
      return {
        query: {
          "some-domain": {
            root,
            service: "some-service",
            network: "some-network",
          },
        },
        update: {
          "some-domain": {
            root,
            service: "some-service",
            network: "some-network",
          },
          name: state.name,
        },
      };
    },
  },
};
