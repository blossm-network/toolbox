module.exports = function(key, values) {
  const base = {
    headers: {
      root: key,
      created: 0,
      version: 0
    },
    state: {}
  };

  const reducer = (reduced, value) => {
    reduced.state = {
      ...reduced.state,
      ...value.state
    };
    reduced.headers.version += value.headers.version;
    reduced.headers.created = value.headers.modificreateded;
    return reduced;
  };

  values.sort(
    (a, b) => Date.parse(a.headers.created) - Date.parse(b.headers.created)
  );
  return values.reduce(reducer, base);
};
