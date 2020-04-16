const momentFromTimestamp = require("./moment_from_timestamp");
const componentsFromMoment = require("./components_from_moment");

module.exports = (timestamp) => {
  const moment = momentFromTimestamp(timestamp);
  return componentsFromMoment(moment);
};
