import dayTimeRange from "./day_time_range.js";
import dateRange from "./date_range.js";
import monthRange from "./month_range.js";
import yearRange from "./year_range.js";
import findError from "./find_error.js";
import object from "./object.js";

export default (dateComponents, { title = "date", path, optional } = {}) => {
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
