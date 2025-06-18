import momentFromComponents from "./moment_from_components.js";
import timestampFromMoment from "./timestamp_from_moment.js";

export default ({ year, month, day, time }) => {
  const moment = momentFromComponents({ year, month, day, time });
  return timestampFromMoment(moment);
};
