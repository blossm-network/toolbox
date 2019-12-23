const deps = require("./deps");

module.exports = ({ procedure, service }) => {
  const hash = deps.hash(procedure.join("") + service).toString();
  //eslint-disable-next-line
  console.log("hash: ", { procedure, service, hash });

  return hash;
};
