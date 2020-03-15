const deps = require("./deps");

module.exports = ({ operation, host, path = "", root }) =>
  `${process.env.NODE_ENV == "local" ? "http" : "https"}://${deps.hash(
    ...operation
  )}.${host}${path}${root != undefined ? `/${root}` : ""}`;
