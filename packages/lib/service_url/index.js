const deps = require("./deps");

module.exports = ({ procedure, service, network, path = "", root }) =>
  `http://${deps.hash({ procedure, service })}.${network}${path}${
    root != undefined ? `/${root}` : ""
  }`;
