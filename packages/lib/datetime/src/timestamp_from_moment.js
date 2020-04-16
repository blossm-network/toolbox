const timestampFromDate = require("./timestamp_from_date");

module.exports = (moment) => {
  return timestampFromDate(moment.toDate());
};
