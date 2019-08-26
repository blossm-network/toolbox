module.exports = async params => {
  for (const key in params) {
    if (
      key != "audiences" &&
      key != "principle" &&
      key != "scopes" &&
      key != "context"
    ) {
      delete params[key];
    }
  }

  for (const scope of params.scopes) {
    for (const key in scope) {
      if (key != "domain" && key != "root" && key != "priviledge") {
        delete scope[key];
      }
    }
  }
};
