import momentFromTimestamp from "./moment_from_timestamp.js";
import componentsFromMoment from "./components_from_moment.js";

export default (timestamp) => {
  const moment = momentFromTimestamp(timestamp);
  return componentsFromMoment(moment);
};
