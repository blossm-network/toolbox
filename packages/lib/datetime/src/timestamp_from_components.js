const momentFromComponents = require("./moment_from_components");
const timestampFromMoment = require("./timestamp_from_moment");

module.exports = ({ year, month, day, time }) => {
  const moment = momentFromComponents({ year, month, day, time });
  return timestampFromMoment(moment);
};
