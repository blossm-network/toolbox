const transports = require("@sustainers/gcp-log-transports");

module.exports = (message, metadata) => transports.verbose(message, metadata);
