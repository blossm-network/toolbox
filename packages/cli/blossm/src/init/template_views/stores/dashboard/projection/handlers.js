export default {
  animals: {
    bird: ({ state, id }) => ({
      id,
      update: {
        latestSound: state.volume < 4 ? state.sound : `${state.sound.toUpperCase()}!`
      },
    }),
  },
};
