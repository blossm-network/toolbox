import moment from "moment-timezone";

export default (string, offset) =>
  moment(string)
    .utcOffset(
      offset + (moment.tz(string, "America/New_York").isDST() ? 60 : 0)
    )
    .format("MMMM Do YYYY, h:mm:ss a");
