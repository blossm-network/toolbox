import timestampFromDate from "./timestamp_from_date.js";

export default (moment) => {
  return timestampFromDate(moment.toDate());
};
