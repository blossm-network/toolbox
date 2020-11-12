//https://stackoverflow.com/questions/11887934/how-to-check-if-dst-daylight-saving-time-is-in-effect-and-if-so-the-offset

const moment = require("moment");

module.exports = (string, offset) => {
  const date = new Date(string);
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  const stdTimezoneOffset = Math.max(
    jan.getTimezoneOffset(),
    jul.getTimezoneOffset()
  );
  const isDstObserved = date.getTimezoneOffset() < stdTimezoneOffset;
  return moment(string)
    .utcOffset(offset)
    .subtract(isDstObserved ? 1 : 0, "h")
    .format();
};
