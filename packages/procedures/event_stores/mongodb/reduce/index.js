module.exports = function(key, values) {
  const base = {
    headers: {
      root: key
    },
    state: {}
  };

  const reducer = (reduced, value) => {
    reduced.state = {
      ...reduced.state,
      ...value.state
    };
    reduced.headers.lastEventNumber = value.headers.lastEventNumber;
    return reduced;
  };

  values.sort((a, b) => a.headers.lastEventNumber - b.headers.lastEventNumber);
  return values.reduce(reducer, base);
};
