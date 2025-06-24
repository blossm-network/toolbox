import logger from "@blossm/logger";

import deps from "../deps.js";

const maxRetryCount = 10;

const connect = async ({ autoIndex, poolSize, connectionString }) => {
  let tryCount = 0;
  while (tryCount < maxRetryCount) {
    try {
      await deps.mongoose.connect(
        connectionString,
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          autoIndex,
          maxPoolSize: poolSize,
        }
      );
      logger.info(`Mongoose connection successful on try ${tryCount}.`);
      break;
    } catch (err) {
      tryCount++;
      logger.error(`Mongoose failed to connect on try ${tryCount}`, { err });
      if (tryCount >= maxRetryCount) throw err;
    }
  }
};

export default async ({
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

  await connect({ connectionString, poolSize, autoIndex });

  const db = deps.mongoose.connection;

  if (onError != undefined) db.on("error", onError);

  if (onOpen != undefined) db.once("open", onOpen);

  return db;
};
