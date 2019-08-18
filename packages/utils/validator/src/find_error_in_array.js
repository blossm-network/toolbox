const findError = require("./find_error");

module.exports = (array, filter) => {
  const filterArray = array.map(obj => filter(obj));
  return findError(filterArray) || null;
};
