module.exports = async body => {
  body.payload = body.payload || {};

  for (const property in body.issuerInfo) {
    if (property != "id" && property != "ip") {
      delete body.issuerInfo[property];
    }
  }
};
