const deps = require("./deps");

module.exports = ({ procedure, service, network, path = "", root }) =>
  `${process.env.NODE_ENV == "local" ? "http" : "https"}://${deps.hash({
    procedure,
    service
  })}.${network}${path}${root != undefined ? `/${root}` : ""}`;
