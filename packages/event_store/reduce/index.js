module.exports = function(key, values) {
  const base = {
    headers: {
      root: key,
      events: 0
    },
    state: {}
  };

  const reducer = (reduced, value) => {
    reduced.state = {
      ...reduced.state,
      ...value.state
    };
    reduced.headers.events++;
    return reduced;
  };

  return values.reduce(reducer, base);
};
