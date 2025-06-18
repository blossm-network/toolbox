import moment from "moment";

export default (string) =>
  moment(string).utc().format("MMMM Do YYYY, h:mm:ss a");
