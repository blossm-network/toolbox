module.exports = async params => {
  for (const key in params.payload) {
    if (key != "permissions" && key != "metadata" && key != "account") {
      delete params.payload[key];
    }
  }
  for (const permission of params.payload.permissions) {
    for (const key in permission) {
      if (key != "scope" && key != "domain" && key != "root") {
        delete permission[key];
      }
    }
  }
  params.payload.metadata = params.payload.metadata || {};
};
