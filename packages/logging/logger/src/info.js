const transports = require("@sustainers/log-transports");

module.exports = (message, metadata) => transports.info(message, metadata);
