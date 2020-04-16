const dayTimeRange = require("./day_time_range");
const dateRange = require("./date_range");
const monthRange = require("./month_range");
const yearRange = require("./year_range");
const findError = require("./find_error");
const object = require("./object");

module.exports = (dateComponents, { title = "date", path, optional } = {}) => {
  const err = findError([object(dateComponents, { optional, path, title })]);
  if (err) return err;

  if (dateComponents == undefined) return;

  const componentsErr = findError([
    dayTimeRange(dateComponents.time, { path: `${path}.time` }),
    dateRange(dateComponents.day, { path: `${path}.day` }),
    monthRange(dateComponents.month, { path: `${path}.month` }),
    yearRange(dateComponents.year, { path: `${path}.year` }),
  ]);

  if (componentsErr) return componentsErr;
};
