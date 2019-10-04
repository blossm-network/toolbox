const fs = require("fs");
const commandHandler = require("@sustainers/command-handler");

const main = require("./main.js");
const validate = fs.existsSync("./validate.js") && require("./validate");
const clean = fs.existsSync("./clean.js") && require("./clean");

const config = require("./config.json");

module.exports = commandHandler({
  version: config.version,
  mainFn: main,
  ...(validate && { validateFn: validate }),
  ...(clean && { cleanFn: clean })
});
