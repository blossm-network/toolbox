const transports = require("@blossm/gcp-log-transports");

module.exports = (message, metadata) => transports.info(message, metadata);
