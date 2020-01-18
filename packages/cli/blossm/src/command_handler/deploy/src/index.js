const fs = require("fs");
const commandHandler = require("@blossm/command-handler");

const main = require("./main.js");
const validate = fs.existsSync("./validate.js") && require("./validate");
const normalize = fs.existsSync("./normalize.js") && require("./normalize");
const fill = fs.existsSync("./fill.js") && require("./fill");

module.exports = commandHandler({
  mainFn: main,
  ...(validate && { validateFn: validate }),
  ...(normalize && { normalizeFn: normalize }),
  ...(fill && { fillFn: fill })
});
