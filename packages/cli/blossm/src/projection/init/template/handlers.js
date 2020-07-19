module.exports = {
  "some-service": {
    "some-domain": {
      "some-action": ({ payload, root }) => {
        //eslint-disable-next-line no-console
        console.log({ payload, root });
        return {
          body: {
            name: payload.name,
          },
        };
      },
    },
  },
};
