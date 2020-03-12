const deps = require("./deps");

module.exports = ({ operation, network, path = "", root }) => {
  //TODO
  // eslint-disable-next-line no-console
  console.log({ operation });
  return `${process.env.NODE_ENV == "local" ? "http" : "https"}://${deps.hash(
    operation
  )}.${network}${path}${root != undefined ? `/${root}` : ""}`;
};
