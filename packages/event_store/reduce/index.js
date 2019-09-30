module.exports = function(key, values) {
  const base = {
    headers: {
      root: key,
      modified: 0,
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
    reduced.headers.modified = value.headers.modified;
    return reduced;
  };

  values.sort(
    (a, b) => Date.parse(a.headers.modified) - Date.parse(b.headers.modified)
  );
  return values.reduce(reducer, base);
};
