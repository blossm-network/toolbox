const transports = require("@sustainers/log-transports");

module.exports = (message, metadata) => transports.warn(message, metadata);
