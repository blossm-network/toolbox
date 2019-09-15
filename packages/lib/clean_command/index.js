module.exports = async params => {
  for (const property in params) {
    if (property != "payload" && property != "headers") {
      delete params[property];
    }
  }

  params.payload = params.payload || {};

  for (const property in params.headers) {
    if (property != "issued" && property != "trace" && property != "source") {
      delete params.headers[property];
    }
  }

  if (params.headers.source != undefined) {
    for (const property in params.headers.source) {
      if (
        property != "id" &&
        property != "action" &&
        property != "domain" &&
        property != "service" &&
        property != "network"
      ) {
        delete params.headers.source[property];
      }
    }
  }
};
