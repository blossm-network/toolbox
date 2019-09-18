const mongoose = require("mongoose");
const urlEncodeQueryData = require("@sustainers/url-encode-query-data");

module.exports = ({
  urlProtocol,
  user,
  password,
  host,
  database,
  parameters = {},
  poolSize = 10,
  autoIndex = false,
  onError = null,
  onOpen = null
}) => {
  let connectionString = `${urlProtocol}://${user}:${password}@${host}/${database}`;

  const queryString = urlEncodeQueryData(parameters);

  if (queryString.length > 0) connectionString += `?${queryString}`;

  mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useCreateIndex: true,
    autoIndex,
    poolSize
  });

  const db = mongoose.connection;

  if (onError != undefined) db.on("error", onError);

  if (onOpen != undefined) db.once("open", onOpen);

  return db;
};
