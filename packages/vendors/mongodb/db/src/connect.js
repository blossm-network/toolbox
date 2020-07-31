const logger = require("@blossm/logger");

const deps = require("../deps");

const maxRetryCount = 10;

let tryCount = 0;

const connect = ({ autoIndex, poolSize, connectionString }) => {
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
    (err) => {
      tryCount++;
      if (err) {
        logger.error(`Mongoose failed to connect on try ${tryCount}`, { err });
        if (tryCount < maxRetryCount)
          connect({ autoIndex, poolSize, connectionString });
      } else {
        logger.info(`Mongoose connection successful on try ${tryCount}.`);
      }
    }
  );
};
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

  connect({ connectionString, poolSize, autoIndex });

  const db = deps.mongoose.connection;

  if (onError != undefined) db.on("error", onError);

  if (onOpen != undefined) db.once("open", onOpen);

  return db;
};
