const { utc } = require("moment");

module.exports = () => {
  const date = new Date();
  return utc(date.getTime());
};
