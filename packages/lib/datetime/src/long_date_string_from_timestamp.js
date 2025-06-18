import momentFromTimestamp from "./moment_from_timestamp.js";

export default (timestamp) =>
  momentFromTimestamp(timestamp).format("MMMM Do YYYY, h:mm:ss a");
