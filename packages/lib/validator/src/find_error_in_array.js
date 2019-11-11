const findError = require("./find_error");

module.exports = (array, filter) =>
  findError(array.map(obj => filter(obj))) || null;
