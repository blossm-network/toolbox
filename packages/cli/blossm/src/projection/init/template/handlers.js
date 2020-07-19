module.exports = {
  "some-service": {
    "some-domain": {
      "some-action": ({ payload, root }) => {
        //eslint-disable-next-line no-console
        console.log({ payload, root });
        return {
          query: {
            "some-domain": {
              root,
              service: "some-service",
              network: "some-network",
            },
          },
          body: {
            "some-domain": {
              root,
              service: "some-service",
              network: "some-network",
            },
            name: payload.name,
          },
        };
      },
    },
  },
};
