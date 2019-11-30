const mongoose = require("mongoose");
const logger = require("@blossm/logger");

const deps = require("../deps");

module.exports = ({
  protocol,
  user,
  password,
  host,
  database,
  parameters = {},
  poolSize = 10,
  autoIndex = false,
  onOpen = () => logger.info("Thank you database."),
  onError = err => logger.error("Database has errored.", { err })
}) => {
  let connectionString = `${protocol}://${user}:${password}@${host}/${database}`;

  const queryString = deps.urlEncodeQueryData(parameters);

  if (queryString.length > 0) connectionString += `?${queryString}`;

  mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    autoIndex,
    poolSize
  });

  const db = mongoose.connection;

  if (onError != undefined) db.on("error", onError);

  if (onOpen != undefined) db.once("open", onOpen);

  return db;
};
