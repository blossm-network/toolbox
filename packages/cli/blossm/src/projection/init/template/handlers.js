module.exports = {
  "some-service": {
    "some-domain": {
      "some-action": ({ payload, root }) => {
        return {
          body: {
            name: payload.name,
          },
        };
      },
    },
  },
};
