const remove = require("./src/operations/remove");
const find = require("./src/operations/find");
const findOne = require("./src/operations/find_one");
const write = require("./src/operations/write");
const forEach = require("./src/operations/for_each");
const count = require("./src/operations/count");
const updateMany = require("./src/operations/update_many");
const connect = require("./src/connect");
const store = require("./src/store");

module.exports = {
  find,
  remove,
  findOne,
  write,
  forEach,
  count,
  updateMany,
  connect,
  store
};
