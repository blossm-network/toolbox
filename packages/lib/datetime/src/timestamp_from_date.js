const millisecondsToSecondsRatio = require("./_milliseconds_to_seconds_ratio");

module.exports = date => {
  return Math.floor(date.getTime() * millisecondsToSecondsRatio);
};
