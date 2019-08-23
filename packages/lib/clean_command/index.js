module.exports = async params => {
  params.payload = params.payload || {};

  params.issuedTimestamp = parseInt(params.issuedTimestamp);

  for (const property in params.issuerInfo) {
    if (property != "id" && property != "ip") {
      delete params.issuerInfo[property];
    }
  }
};
