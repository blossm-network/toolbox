const moment = require("moment");

module.exports = (string) =>
  moment(string).utc().format("MMMM Do YYYY, h:mm:ss a");
