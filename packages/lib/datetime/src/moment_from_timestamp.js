const { utc } = require("moment");

const millisecondsToSecondsRatio = require("./_milliseconds_to_seconds_ratio");

module.exports = timestamp => {
  return utc(timestamp / millisecondsToSecondsRatio);
};
