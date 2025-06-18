import moment from "moment-timezone";

// Check to see if it's daylight savings in New York at
// the given time. If so, append to the offset.
export default (string, offset) =>
  moment(string)
    .utcOffset(
      offset + (moment.tz(string, "America/New_York").isDST() ? 60 : 0)
    )
    .format();
