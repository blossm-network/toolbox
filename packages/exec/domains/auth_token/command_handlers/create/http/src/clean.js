module.exports = async params => {
  for (const key in params.payload) {
    if (
      key != "audience" &&
      key != "metadata" &&
      key != "issuer" &&
      key != "subject"
    ) {
      delete params.payload[key];
    }
  }
  for (const audience of params.payload.audience) {
    for (const key in audience) {
      if (
        key != "scope" &&
        key != "domain" &&
        key != "root" &&
        key != "service"
      ) {
        delete audience[key];
      }
    }
  }
  params.payload.metadata = params.payload.metadata || {};
};
