module.exports = (key, values) => {
  const base = {
    root: key,
    _metadata: {
      count: 0
    }
  };

  const reducer = (reduced, value) => {
    const sum = { ...reduced, ...value };
    sum._metadata.count += value._metadata.count;
    return sum;
  };

  return values.reduce(reducer, base);
};
