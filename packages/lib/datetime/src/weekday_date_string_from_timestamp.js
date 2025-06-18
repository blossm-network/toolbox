import momentFromTimestamp from "./moment_from_timestamp.js";

export default (timestamp) => {
  const moment = momentFromTimestamp(timestamp);
  return moment.format("dddd, MMM Do");
};
