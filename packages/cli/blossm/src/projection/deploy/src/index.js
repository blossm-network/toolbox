const projection = require("@blossm/projection");

const main = require("./main.js");

const config = require("./config.json");

module.exports = projection({
  mainFn: main,
  name: config.name,
  domain: config.domain
});
