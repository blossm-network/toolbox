module.exports = async params => {
  for (const property in params) {
    if (property != "payload" && property != "header") {
      delete params[property];
    }
  }

  params.payload = params.payload || {};

  for (const property in params.header) {
    if (property != "issued" && property != "trace" && property != "source") {
      delete params.header[property];
    }
  }

  if (params.header.source != undefined) {
    for (const property in params.header.source) {
      if (
        property != "id" &&
        property != "action" &&
        property != "domain" &&
        property != "service" &&
        property != "network"
      ) {
        delete params.header.source[property];
      }
    }
  }
};
