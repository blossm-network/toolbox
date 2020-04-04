const job = require("@blossm/post-job");

const main = require("./main.js");

module.exports = job({ mainFn: main });
