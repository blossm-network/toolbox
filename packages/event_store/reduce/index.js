module.exports = function(key, values) {
  const base = {
    headers: {
      root: key
    },
    payload: {},
    metadata: {
      count: 0
    }
  };

  const reducer = (reduced, value) => {
    reduced.payload = {
      ...reduced.payload,
      ...value.payload
    };
    reduced.metadata.count++;
    return reduced;
  };

  return values.reduce(reducer, base);
};
