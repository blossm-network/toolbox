module.exports = function(key, values) {
  const base = {
    root: key,
    payload: {},
    metadata: {
      count: 0
    }
  };

  const reducer = (reduced, value) => {
    return {
      root: reduced.root,
      payload: { ...reduced.payload, ...value.payload },
      metadata: {
        count: reduced.metadata.count + 1
      }
    };
  };

  return values.reduce(reducer, base);
};
