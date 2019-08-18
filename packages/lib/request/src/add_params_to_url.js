const queryString = require("query-string");
module.exports = (url, params) => `${url}/${queryString.stringify(params)}`;
