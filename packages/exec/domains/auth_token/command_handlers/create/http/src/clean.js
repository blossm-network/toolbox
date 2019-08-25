module.exports = async params => {
  for (const key in params.payload) {
    if (key != "audiences" && key != "metadata" && key != "subject") {
      delete params.payload[key];
    }
  }
  params.payload.metadata = params.payload.metadata || {};
};
