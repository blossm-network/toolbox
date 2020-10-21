//TODO better documentation
module.exports = {
  animals: {
    bird: ({ state, id }) => {
      //eslint-disable-next-line no-console
      console.log({ state, id });
      return {
        id,
        // query: {
        //   "some-domain": {
        //     service: "some-service",
        //     network: "some-network",
        //   },
        // },
        update: {
          sound:
            state.volume < 4 ? state.sound : `${state.sound.toUpperCase()}!`,
        },
      };
    },
  },
};
