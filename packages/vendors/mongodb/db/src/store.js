const mongoose = require("mongoose");

const connect = require("./connect");
const deps = require("../deps");

module.exports = ({
  name,
  schema,
  indexes = [],
  connection: {
    protocol,
    user,
    password,
    host,
    database,
    parameters,
    poolSize,
    autoIndex,
    onError,
    onOpen,
  } = {},
}) => {
  if (name == undefined || name.length == 0)
    throw deps.internalServerError.message("Store needs a name.");

  if (
    user != undefined &&
    password != undefined &&
    host != undefined &&
    protocol != undefined &&
    database != undefined
  ) {
    connect({
      protocol,
      user,
      password,
      host,
      database,
      parameters,
      poolSize,
      autoIndex,
      onError,
      onOpen,
    });
  }

  const store = new mongoose.Schema(
    {},
    { strict: schema != undefined, typePojoToMixed: false, minimize: false }
  );

  if (schema) store.add(schema);
  for (const index of indexes) {
    store.index(...index);
  }

  return mongoose.model(name, store);
};
