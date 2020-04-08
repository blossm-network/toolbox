const deps = require("./deps");

module.exports = ({ operation, host, path = "", id }) =>
  `${process.env.NODE_ENV == "local" ? "http" : "https"}://${deps.hash(
    ...operation
  )}.${host}${path}${id != undefined ? `/${id}` : ""}`;
