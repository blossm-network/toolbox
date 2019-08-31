module.exports = async payload => {
  for (const key in payload) {
    if (
      key != "audiences" &&
      key != "principle" &&
      key != "scopes" &&
      key != "context"
    ) {
      delete payload[key];
    }
  }

  for (const scope of payload.scopes) {
    for (const key in scope) {
      if (key != "domain" && key != "root" && key != "priviledge") {
        delete scope[key];
      }
    }
  }
};
