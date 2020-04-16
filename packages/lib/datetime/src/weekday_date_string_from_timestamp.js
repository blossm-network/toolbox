const momentFromTimestamp = require("./moment_from_timestamp");

module.exports = (timestamp) => {
  const moment = momentFromTimestamp(timestamp);
  return moment.format("dddd, MMM Do");
};
