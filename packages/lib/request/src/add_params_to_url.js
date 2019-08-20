const queryString = require("query-string");
module.exports = (url, params) =>
  params == undefined ? url : `${url}?${queryString.stringify(params)}`;
