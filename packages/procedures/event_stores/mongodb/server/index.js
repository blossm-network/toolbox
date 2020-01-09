const logger = require("@blossm/logger");

const deps = require("./deps");

const aggregateStoreName = `${process.env.DOMAIN}.aggregate`;

let _eventStore;
let _aggregateStore;

//make all properties not required since events may
//not contain the full schema.
const formatSchema = ({ schema }) => {
  const newSchema = {};
  for (const property in schema) {
    newSchema[property] =
      typeof schema[property] == "object" && schema[property].type != undefined
        ? schema[property]
        : {
            type: schema[property]
          };
    newSchema[property].required = false;
  }
  return newSchema;
};
const removeIds = ({ schema, subdocumentsOnly = true }) => {
  for (const property in schema) {
    if (
      schema[property] instanceof Array &&
      typeof schema[property][0] == "object"
    ) {
      schema[property][0] = removeIds({
        schema: schema[property][0],
        subdocumentsOnly: false
      });
    } else if (
      typeof schema[property] == "object" &&
      schema[property].type instanceof Array
    ) {
      schema[property].type[0] = removeIds({
        schema: schema[property].type[0],
        subdocumentsOnly: false
      });
    } else if (
      typeof schema[property] == "object" &&
      schema[property].type == undefined
    ) {
      schema[property]._id = false;
    }
  }

  if (!subdocumentsOnly) schema._id = false;
  return schema;
};
const eventStore = async schema => {
  if (_eventStore != undefined) {
    logger.info("Thank you existing event store database.");
    return _eventStore;
  }

  _eventStore = deps.db.store({
    name: `${process.env.DOMAIN}`,
    schema: {
      id: { type: String, required: true, unique: true },
      created: { type: String, required: true },
      payload: formatSchema(schema),
      headers: {
        root: { type: String, required: true },
        number: { type: Number, required: true },
        numberRoot: { type: String, required: true, unique: true },
        topic: { type: String, required: true },
        version: { type: Number, required: true },
        context: { type: Object },
        trace: { type: String },
        created: { type: String, required: true },
        command: {
          id: { type: String, required: true },
          action: { type: String, required: true },
          domain: { type: String, required: true },
          service: { type: String, required: true },
          network: { type: String, required: true },
          issued: { type: String, required: true }
        }
      }
    },
    indexes: [
      [{ id: 1 }],
      [{ "headers.root": 1 }],
      [{ "headers.root": 1, "headers.number": -1 }]
    ],
    connection: {
      protocol: process.env.MONGODB_PROTOCOL,
      user: process.env.MONGODB_USER,
      password:
        process.env.NODE_ENV == "local"
          ? process.env.MONGODB_USER_PASSWORD
          : await deps.secret("mongodb"),
      host: process.env.MONGODB_HOST,
      database: process.env.MONGODB_DATABASE,
      parameters: { authSource: "admin", retryWrites: true, w: "majority" },
      autoIndex: true
    }
  });

  return _eventStore;
};

const aggregateStore = async ({ schema }) => {
  if (_aggregateStore != undefined) {
    logger.info("Thank you existing aggregate store database.");
    return _aggregateStore;
  }

  _aggregateStore = deps.db.store({
    name: aggregateStoreName,
    schema: {
      value: {
        headers: {
          root: { type: String, required: true, unique: true },
          modified: { type: Number, required: true },
          events: { type: Number, required: true }
        },
        state: schema
      }
    },
    indexes: [[{ "value.headers.root": 1 }]]
  });

  return _aggregateStore;
};

module.exports = async ({ schema, publishFn } = {}) => {
  const eStore = await eventStore({ schema: removeIds({ schema }) });
  const aStore = await aggregateStore({ schema: removeIds({ schema }) });

  const writeFn = async ({ id, data }) => {
    const result = await deps.db.write({
      store: eStore,
      query: { id },
      update: {
        $set: data
      },
      options: {
        lean: true,
        omitUndefined: true,
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    });
    delete result._id;
    delete result.__v;
    return result;
  };

  const mapReduceFn = async ({ id }) =>
    await deps.db.mapReduce({
      store: eStore,
      query: { id },
      map: deps.normalize,
      reduce: deps.reduce,
      out: { reduce: aggregateStoreName }
    });

  const findOneFn = async ({ root }) => {
    const aggregate = await deps.db.findOne({
      store: aStore,
      query: {
        "value.headers.root": root
      },
      options: {
        lean: true
      }
    });

    return aggregate ? aggregate.value : null;
  };

  deps.eventStore({
    findOneFn,
    writeFn,
    mapReduceFn,
    publishFn
  });
};
