import connect from "./connect.js";
import deps from "../deps.js";

export default async ({
  name,
  schema,
  indexes = [],
  typeKey,
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
    await connect({
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
    versionKey: false,
    useNestedStrict: true,
    minimize: false,
    ...(typeKey && { typeKey }),
  });

  for (const index of indexes) store.index(...index);

  const model = deps.mongoose.model(name, store, name);
  await model.init();
  return model;
};
