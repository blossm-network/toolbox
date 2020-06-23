const deps = require("./deps");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = async ({ enqueueFn, url, data, operation }) =>
  enqueueFn({
    url,
    data,
    hash: deps.hash(...operation),
    name: deps.trim(`${operation.slice().reverse().join("-")}`, MAX_LENGTH),
  });
