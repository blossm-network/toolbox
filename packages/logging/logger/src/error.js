const transports = require("@sustainers/log-transports");

module.exports = (message, metadata) => transports.error(message, metadata);
