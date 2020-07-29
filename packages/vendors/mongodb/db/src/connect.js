const logger = require("@blossm/logger");

const deps = require("../deps");

module.exports = ({
  protocol,
  user,
  password,
  host,
  database,
  parameters,
  poolSize = 5,
  autoIndex = false,
  onOpen = () => logger.info("Thank you database."),
  onError = (err) => logger.error("Database has errored.", { err }),
}) => {
  const connectionString = deps.urlEncodeQueryData(
    `${protocol}://${user}:${password}@${host}/${database}`,
    ...(parameters ? [parameters] : [])
  );

  deps.mongoose.connect(
    connectionString,
    {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      autoIndex,
      poolSize,
    },
    (err) => logger.error("Mongoose failed to connect", { err })
  );

  const db = deps.mongoose.connection;

  if (onError != undefined) db.on("error", onError);

  if (onOpen != undefined) db.once("open", onOpen);

  return db;
};
