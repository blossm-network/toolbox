module.exports = async params => {
  for (const property in params) {
    if (
      property != "payload" &&
      property != "issuerInfo" &&
      property != "issuedTimestamp" &&
      property != "traceId" &&
      property != "sourceCommand"
    ) {
      delete params[property];
    }
  }

  params.payload = params.payload || {};

  for (const property in params.issuerInfo) {
    if (property != "id" && property != "ip") {
      delete params.issuerInfo[property];
    }
  }

  if (params.sourceCommand != undefined) {
    for (const property in params.sourceCommand) {
      if (
        property != "id" &&
        property != "action" &&
        property != "domain" &&
        property != "service" &&
        property != "network"
      ) {
        delete params.sourceCommand[property];
      }
    }
  }
};
