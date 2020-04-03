// const deps = require("./deps");

// let token;
// let exp;

module.exports = async ({ id, secret }) =>
  Buffer.from(`${id}:${secret}`).toString("base64");
