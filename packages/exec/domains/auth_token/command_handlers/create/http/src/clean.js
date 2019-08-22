module.exports = async body => {
  for (const key in body.payload) {
    if (key != "permissions" && key != "metadata" && key != "account") {
      delete body.payload[key];
    }
  }
  for (const permission of body.payload.permissions) {
    for (const key in permission) {
      if (key != "scope" && key != "domain" && key != "root") {
        delete permission[key];
      }
    }
  }
  body.payload.metadata = body.payload.metadata || {};
};
