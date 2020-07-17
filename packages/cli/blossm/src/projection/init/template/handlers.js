module.exports = {
  "some-service": {
    "some-domain": {
      "some-action": (event) => {
        return {
          body: {
            name: event.name,
          },
          // domain: {
          //   root: "some-domain-root",
          //   service: "some-domain-service",
          //   network: "some-domain-network",
          // },
        };
      },
    },
  },
};
