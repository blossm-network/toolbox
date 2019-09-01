const transports = require("@sustainers/log-transports");

module.exports = (message, metadata) => transports.verbose(message, metadata);
