const momentFromTimestamp = require("./moment_from_timestamp");

module.exports = (timestamp) =>
  momentFromTimestamp(timestamp).format("MMMM Do YYYY, h:mm:ss a");
