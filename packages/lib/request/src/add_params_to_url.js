// const queryString = require("query-string");
const queryString = require("qs");

// const resolveQueryString = params => {
//   const result = {};
//   for (const property in params) {
//     if (
//       typeof params[property] == "object" &&
//       !(params[property] instanceof Array)
//     ) {
//       result[property] = resolveQueryString(params[property]);
//     } else {
//       result[property] = params[property];
//     }
//   }

//   return queryString.stringify(result);
// };
module.exports = (url, params) =>
  params == undefined ? url : `${url}?${queryString.stringify(params)}`;
