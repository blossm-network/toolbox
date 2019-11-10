const transports = require("@blossm/gcp-log-transports");

module.exports = (message, metadata) => transports.debug(message, metadata);
