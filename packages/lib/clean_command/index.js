module.exports = async params => {
  params.payload = params.payload || {};

  for (const property in params.issuerInfo) {
    if (property != "id" && property != "ip") {
      delete params.issuerInfo[property];
    }
  }
};
