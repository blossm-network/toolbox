const dayTimeRange = require("./day_time_range");
const dateRange = require("./date_range");
const monthRange = require("./month_range");
const yearRange = require("./year_range");
const findError = require("./find_error");
const object = require("./object");

module.exports = (dateComponents, { title = "date", optional } = {}) => {
  const err = findError([object(dateComponents, { optional, title })]);
  if (err) return err;

  if (dateComponents == undefined) return;

  const componentsErr = findError([
    dayTimeRange(dateComponents.time),
    dateRange(dateComponents.day),
    monthRange(dateComponents.month),
    yearRange(dateComponents.year)
  ]);

  if (componentsErr) return componentsErr;
};
