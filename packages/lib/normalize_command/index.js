const deps = require("./deps");
module.exports = async params => {
  return {
    ...(params.root && { root: params.root }),
    payload: params.payload || {},
    headers: {
      id: deps.uuid(),
      issued: params.headers.issued,
      ...(params.headers.trace && { trace: params.headers.trace }),
      ...(params.headers.source && { source: params.headers.source })
    }
  };
};
