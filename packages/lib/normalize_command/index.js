module.exports = async params => {
  return {
    payload: params.payload || {},
    headers: {
      issued: params.headers.issued,
      ...(params.headers.trace && { trace: params.headers.trace }),
      ...(params.headers.source && { source: params.headers.source })
    }
  };
};
