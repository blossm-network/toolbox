module.exports = async body => {
  body.payload = body.payload || {};

  body.issuedTimestamp = parseInt(body.issuedTimestamp);

  for (const property in body.issuerInfo) {
    if (property != "id" && property != "ip") {
      delete body.issuerInfo[property];
    }
  }
};
