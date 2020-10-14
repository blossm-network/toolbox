module.exports = {
  "some-service": {
    "some-domain": ({ state, id }) => {
      //eslint-disable-next-line no-console
      console.log({ state, id });
      return {
        id,
        query: {
          "some-domain": {
            service: "some-service",
            network: "some-network",
          },
        },
        update: {
          "some-domain": {
            id,
            service: "some-service",
            network: "some-network",
          },
          name: state.name,
        },
      };
    },
  },
};
