const deps = require("./deps");

module.exports = ({ operation, network, path = "", root }) =>
  `${process.env.NODE_ENV == "local" ? "http" : "https"}://${deps.hash(
    ...operation
  )}.${network}${path}${root != undefined ? `/${root}` : ""}`;
