const queryString = require("qs");

module.exports = (url, params) =>
  params == undefined ? url : `${url}?${queryString.stringify(params)}`;
