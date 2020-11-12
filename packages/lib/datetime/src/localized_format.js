//https://stackoverflow.com/questions/11887934/how-to-check-if-dst-daylight-saving-time-is-in-effect-and-if-so-the-offset

const moment = require("moment");

module.exports = (string, offset) => {
  console.log({ isDST: moment(string).isDST() });
  console.log({ offset });
  console.log({ moment: moment(string).format() });
  console.log({ utcMoment: moment(string).utcOffset(offset).format() });
  return moment(string)
    .utcOffset(offset)
    .add(moment(string).isDST() ? 1 : 0, "h")
    .format();
};
