import moment from "moment";
const { utc } = moment;

import millisecondsToSecondsRatio from "./_milliseconds_to_seconds_ratio.js";

export default (timestamp) => {
  return utc(timestamp / millisecondsToSecondsRatio);
};
