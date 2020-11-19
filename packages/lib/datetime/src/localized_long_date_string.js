const moment = require("moment-timezone");

module.exports = (string, offset) =>
  moment(string)
    .utcOffset(
      offset + (moment.tz(string, "America/New_York").isDST() ? 60 : 0)
    )
    .format("MMMM Do YYYY, h:mm:ss a");
