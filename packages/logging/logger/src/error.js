const transports = require("@sustainers/gcp-log-transports");

module.exports = (message, metadata) => transports.error(message, metadata);
