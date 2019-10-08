const deps = require("./deps");

module.exports = async params => {
  return {
    payload: params.payload || {},
    headers: {
      id: deps.nonce(),
      issued: params.headers.issued,
      ...(params.headers.trace && { trace: params.headers.trace }),
      ...(params.headers.source && { source: params.headers.source })
    }
  };
};
