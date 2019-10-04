const fs = require("fs");
const commandHandler = require("@sustainers/command-handler");

const main = require("./main");
const validate = fs.existsSync("./validate") && require("./validate");
const clean = fs.existsSync("./clean") && require("./clean");

const config = require("./config.json");

//eslint-disable-next-line no-console
console.log("clean is: ", clean);

module.exports = commandHandler({
  version: config.version,
  mainFn: main,
  ...(validate && { validateFn: validate }),
  ...(clean && { cleanFn: clean })
});
