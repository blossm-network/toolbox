module.exports = function(key, values) {
  const base = {
    headers: {
      root: key,
      events: 0
    },
    state: {}
  };

  const reducer = (reduced, value) => {
    //eslint-disable-next-line
    console.log("reducing: ", { reduced, value });
    reduced.state = {
      ...reduced.state,
      ...value.state
    };
    reduced.headers.events++;
    return reduced;
  };

  //eslint-disable-next-line
  console.log("values: ", values);
  return values.reduce(reducer, base);
};
