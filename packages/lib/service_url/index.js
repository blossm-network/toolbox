const deps = require("./deps");

module.exports = ({ operation, service, network, path = "", root }) =>
  `http://${deps.hash({ operation, service })}.${network}${path}${
    root != undefined ? `/${root}` : ""
  }`;
