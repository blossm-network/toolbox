const { createLogger, transports, format } = require("winston");
const { LoggingWinston } = require("@google-cloud/logging-winston");

const loggerTransports = createLogger({
  level: "debug",
  format: format.json(),
  transports: [
    // Logs to stack driver.
    ...(["production", "sandbox", "staging"].includes(process.env.NODE_ENV)
      ? [
          new LoggingWinston({
            serviceContext: {
              ...(process.env.NAME && { name: process.env.NAME }),
              ...(process.env.DOMAIN && { domain: process.env.DOMAIN }),
              ...(process.env.SERVICE && { service: process.env.SERVICE }),
              ...(process.env.CONTEXT && { context: process.env.CONTEXT }),
              ...(process.env.OPERATION_HASH && {
                operationHash: process.env.OPERATION_HASH,
              }),
              ...(process.env.PROCEDURE && {
                procedure: process.env.PROCEDURE,
              }),
              ...(process.env.NETWORK && { network: process.env.NETWORK }),
              version: "0",
            },
          }),
        ]
      : []),
    //
    // Log to the `console` with the format:
    // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
    //
    new transports.Console({
      level: "verbose",
      format: format.combine(
        format.timestamp(),
        format.colorize(),
        format.simple()
      ),
      timestamp: true,
    }),
  ],
});

module.exports = loggerTransports;
