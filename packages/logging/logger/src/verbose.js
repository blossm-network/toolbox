const transports = require("@blossm/gcp-log-transports");

module.exports = (message, metadata) => transports.verbose(message, metadata);
