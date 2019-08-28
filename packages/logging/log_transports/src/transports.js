const { createLogger, transports, format } = require("winston");
const { LoggingWinston } = require("@google-cloud/logging-winston");

const loggerTransports = createLogger({
  level: "debug",
  format: format.json(),
  transports: [
    // Logs to stack driver.
    new LoggingWinston({
      serviceContext: {
        service: "roof",
        version: "0"
      }
    }),
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
      timestamp: true
    })
  ]
});

module.exports = loggerTransports;
