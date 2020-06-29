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
    throw deps.internalServerError.message("This store needs a name.");

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

  const store = new deps.mongoose.Schema(schema || {}, {
    strict: schema != undefined,
    typePojoToMixed: false,
    useNestedStrict: true,
    minimize: false,
    typeKey: "$type",
  });

  for (const index of indexes) store.index(...index);

  //TODO
  //eslint-disable-next-line no-console
  console.log({ vstore: store });

  return deps.mongoose.model(name, store, name);
};
