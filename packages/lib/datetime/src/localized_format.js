//https://stackoverflow.com/questions/11887934/how-to-check-if-dst-daylight-saving-time-is-in-effect-and-if-so-the-offset

const moment = require("moment");

module.exports = (string, offset) =>
  moment(string)
    .utcOffset(offset)
    .subtract(moment(string).isDST() ? 1 : 0, "h")
    .format();
