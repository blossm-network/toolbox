const fs = require("fs");
const commandHandler = require("@sustainers/command-handler");

const main = require("./main.js");
const validate = fs.existsSync("./validate.js") && require("./validate");
const normalize = fs.existsSync("./normalize.js") && require("./normalize");

const config = require("./config.json");

module.exports = commandHandler({
  version: config.version,
  mainFn: main,
  ...(validate && { validateFn: validate }),
  ...(normalize && { normalizeFn: normalize })
});
