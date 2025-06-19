//TODO better documentation
export default {
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
          latestSound:
            state.volume < 4 ? state.sound : `${state.sound.toUpperCase()}!`,
        },
      };
    },
  },
};
