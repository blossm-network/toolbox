import millisecondsToSecondsRatio from "./_milliseconds_to_seconds_ratio.js";

export default (date) => {
  return Math.floor(date.getTime() * millisecondsToSecondsRatio);
};
