const logger = require("@blossm/logger");

const deps = require("./deps");

const snapshotStoreName = `${process.env.DOMAIN}.snapshots`;

let _eventStore;
let _snapshotStore;

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

const eventStore = async schema => {
  if (_eventStore != undefined) {
    logger.info("Thank you existing event store database.");
    return _eventStore;
  }

  _eventStore = deps.db.store({
    name: `${process.env.DOMAIN}`,
    schema: {
      id: { type: String, required: true, unique: true },
      saved: { type: String, required: true },
      payload: formatSchema(schema),
      headers: {
        root: { type: String, required: true },
        number: { type: Number, required: true },
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
      [{ "headers.root": 1, "headers.number": 1 }]
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

const snapshotStore = async ({ schema }) => {
  if (_snapshotStore != undefined) {
    logger.info("Thank you existing snapshot store database.");
    return _snapshotStore;
  }

  _snapshotStore = deps.db.store({
    name: snapshotStoreName,
    schema: {
      created: { type: Number, required: true },
      headers: {
        root: { type: String, required: true, unique: true },
        lastEventNumber: { type: Number, required: true }
      },
      state: schema
    },
    indexes: [[{ "headers.root": 1 }]]
  });

  return _snapshotStore;
};

module.exports = async ({
  schema,
  publishFn
  // archiveSnapshotFn,
  // archiveEventsFn
} = {}) => {
  const eStore = await eventStore({ schema: deps.removeIds({ schema }) });
  const sStore = await snapshotStore({ schema: deps.removeIds({ schema }) });

  const saveEventFn = async event => {
    //eslint-disable-next-line
    console.log("will create data: ", event);
    const [result] = await deps.db.create({
      store: eStore,
      data: event
    });

    //eslint-disable-next-line
    console.log("created result: ", result);
    // const result = await deps.db.write({
    //   store: eStore,
    //   query: { id: event.id },
    //   update: {
    //     $set: event
    //   },
    //   options: {
    //     lean: true,
    //     omitUndefined: true,
    //     upsert: true,
    //     new: true,
    //     runValidators: true,
    //     setDefaultsOnInsert: true
    //   }
    // });
    delete result._id;
    delete result.__v;
    return result;
  };

  // const saveSnapshotFn = async snapshot => {
  //   const savedSnapshot = await deps.db.write({
  //     store: sStore,
  //     query: { "headers.root": snapshot.headers.root },
  //     update: {
  //       $set: snapshot
  //     },
  //     options: {
  //       lean: true,
  //       omitUndefined: true,
  //       upsert: true,
  //       new: true,
  //       runValidators: false,
  //       setDefaultsOnInsert: false
  //     }
  //   });

  //   await Promise.all([
  //     archiveSnapshotFn({
  //       root: savedSnapshot.headers.root,
  //       snapshot: savedSnapshot
  //     }),
  //     cleanOldEvents({
  //       root: savedSnapshot.headers.root,
  //       number: savedSnapshot.headers.lastEventNumber
  //     })
  //   ]);
  // };

  // const cleanOldEvents = async ({ root, number }) => {
  //   const query = {
  //     "headers.root": root,
  //     "headers.number": {
  //       $lte: number
  //     }
  //   };

  //   const events = deps.db.find({
  //     store: eStore,
  //     query,
  //     sort: {
  //       "headers.number": 1
  //     },
  //     options: {
  //       lean: true
  //     }
  //   });

  //   await archiveEventsFn({ root, events });
  //   await deps.db.remove({
  //     store: eStore,
  //     query
  //   });
  // };

  const aggregateFn = async root => {
    const [events, snapshot] = await Promise.all([
      deps.db.find({
        store: eStore,
        query: {
          "headers.root": root
        },
        sort: {
          "headers.number": 1
        },
        options: {
          lean: true
        }
      }),
      deps.db.findOne({
        store: sStore,
        query: {
          "headers.root": root
        },
        options: {
          lean: true
        }
      })
    ]);

    if (!events.length && !snapshot) return null;

    const aggregate = events
      .filter(event =>
        snapshot
          ? event.headers.number > snapshot.headers.lastEventNumber
          : true
      )
      .reduce(
        (accumulator, event) => {
          return {
            headers: {
              root: accumulator.headers.root,
              lastEventNumber: event.headers.number
            },
            state: {
              ...accumulator.state,
              ...event.payload
            }
          };
        },
        {
          headers: snapshot ? snapshot.headers : { root },
          state: snapshot ? snapshot.state : {}
        }
      );

    return aggregate;
  };

  deps.eventStore({
    aggregateFn,
    saveEventFn,
    // saveSnapshotFn,
    publishFn
  });
};
