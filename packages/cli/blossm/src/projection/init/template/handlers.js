module.exports = {
  "some-action": (_, event) => {
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
};
