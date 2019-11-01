// const fs = require("fs");
const gateway = require("@sustainers/auth-gateway");

// const main = require("./main.js");
// const validate = fs.existsSync("./validate.js") && require("./validate");
// const normalize = fs.existsSync("./normalize.js") && require("./normalize");

// const config = require("./config.json");

module.exports = gateway({
  // mainFn: main,
  // ...(validate && { validateFn: validate }),
  // ...(normalize && { normalizeFn: normalize })
});
