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

  values.sort(
    (a, b) =>
      Date.parse(a.headers.lastEventNumber) -
      Date.parse(b.headers.lastEventNumber)
  );
  return values.reduce(reducer, base);
};
