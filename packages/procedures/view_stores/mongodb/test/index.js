const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, match, useFakeTimers } = require("sinon");

const deps = require("../deps");

let clock;

const now = new Date();

const schema = { a: 1, b: { c: 2 } };
const indexes = [[{ "some-index": 1 }]];

const protocol = "some-db-protocol";
const name = "some-name";
const context = "some-context";
const user = "some-db-user";
const userPassword = "some-db-user-password";
const host = "some-host";
const database = "some-db";
const password = "some-password";
const query = "some-query";
const sort = "some-sort";
const sort2 = "some-other-sort";
const query2 = "some-other-query";
const count = "some-count";
const upsert = "some-upsert";

const writeResult = "some-write-result";
const removeResult = "some-remove-result";
const data = { c: 1 };
const fnFake = fake();
const parallel = "some-parallel";
const one = "some-one";

process.env.NAME = name;
process.env.CONTEXT = context;
process.env.MONGODB_PROTOCOL = protocol;
process.env.MONGODB_USER = user;
process.env.MONGODB_USER_PASSWORD = userPassword;
process.env.MONGODB_HOST = host;
process.env.MONGODB_DATABASE = database;

let mongodbViewStore;
describe("View store", () => {
  beforeEach(() => {
    delete require.cache[require.resolve("..")];
    mongodbViewStore = require("..");
    process.env.NODE_ENV = "some-env";
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const store = "some-store";
    const storeFake = fake.returns(store);

    const cursorFake = fake.returns({
      eachAsync: async (fn, options) => {
        const view = { a: 1 };
        await fn(view);
        expect(fnFake).to.have.been.calledWith(view);
        expect(options).to.deep.equal({ parallel });
        return foundObjs;
      },
    });

    const foundObjs = {
      cursor: cursorFake,
    };
    const findFake = fake.returns(foundObjs);
    const countFake = fake.returns(count);
    const writeFake = fake.returns(writeResult);
    const removeFake = fake.returns(removeResult);

    const db = {
      store: storeFake,
      find: findFake,
      count: countFake,
      write: writeFake,
      remove: removeFake,
    };
    replace(deps, "db", db);

    const secretFake = fake.returns(password);

    const dateString = "some-date";
    const dateStringFake = fake.returns(dateString);
    replace(deps, "dateString", dateStringFake);

    const viewStoreFake = fake();
    replace(deps, "viewStore", viewStoreFake);

    const formattedSchema = "some-formatted-schema";
    const formatSchemaFake = fake.returns(formattedSchema);
    replace(deps, "formatSchema", formatSchemaFake);

    const getFn = "some-get-fn";
    const updateFn = "some-update-fn";
    const formatFn = "some-format-fn";

    await mongodbViewStore({
      schema,
      indexes,
      secretFn: secretFake,
      getFn,
      updateFn,
      formatFn,
      one,
    });

    expect(formatSchemaFake).to.have.been.calledWith(schema, "$type");
    expect(storeFake).to.have.been.calledWith({
      name: "views",
      schema: {
        body: formattedSchema,
        headers: {
          _id: false,
          id: {
            $type: String,
            required: true,
            unique: true,
            default: deps.uuid,
          },
          context: {
            $type: {
              root: String,
              domain: String,
              service: String,
              network: String,
              _id: false,
            },
            required: true,
          },
          created: {
            $type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
          modified: {
            $type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
        },
        trace: { $type: Object },
      },
      typeKey: "$type",
      indexes: [
        [{ "headers.id": 1 }],
        [
          { "headers.context.root": 1 },
          { "headers.context.domain": 1 },
          { "headers.context.service": 1 },
          { "headers.context.network": 1 },
        ],
        [{ "body.some-index": 1 }],
      ],
      connection: {
        protocol,
        user,
        password,
        host,
        database,
        parameters: {
          authSource: "admin",
          retryWrites: true,
          w: "majority",
        },
        autoIndex: true,
      },
    });
    expect(secretFake).to.have.been.calledWith("mongodb-view-store");

    const limit = "some-limit";
    const skip = "some-skip";
    const findFnResult = await viewStoreFake.lastCall.lastArg.findFn({
      limit,
      skip,
      query,
      sort,
    });

    expect(findFake).to.have.been.calledWith({
      store,
      query,
      limit,
      skip,
      sort,
      options: {
        lean: true,
      },
    });
    expect(findFnResult).to.equal(foundObjs);

    const countFnResult = await viewStoreFake.lastCall.lastArg.countFn({
      query,
    });

    expect(countFake).to.have.been.calledWith({
      store,
      query,
    });

    expect(countFnResult).to.equal(count);

    const steamFnResult = await viewStoreFake.lastCall.lastArg.streamFn({
      query: query2,
      sort: sort2,
      parallel,
      fn: fnFake,
    });

    expect(findFake).to.have.been.calledWith({
      store,
      query: query2,
      sort: sort2,
      options: {
        lean: true,
      },
    });
    expect(steamFnResult).to.equal(foundObjs);

    const writeFnResult = await viewStoreFake.lastCall.lastArg.writeFn({
      query,
      data,
      upsert,
    });
    expect(writeFake).to.have.been.calledWith({
      store,
      query,
      update: {
        $set: data,
      },
      options: {
        lean: true,
        omitUndefined: true,
        upsert,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    });
    expect(writeFnResult).to.equal(writeResult);

    const removeFnResult = await viewStoreFake.lastCall.lastArg.removeFn(query);
    expect(removeFake).to.have.been.calledWith({
      store,
      query,
    });
    expect(removeFnResult).to.equal(removeResult);

    expect(viewStoreFake).to.have.been.calledWith({
      streamFn: match(
        (fn) => expect(fn({ query, sort, parallel, fn: fnFake })).to.exist
      ),
      findFn: match((fn) => expect(fn({ query, sort })).to.exist),
      countFn: match((fn) => expect(fn({ query })).to.exist),
      writeFn: match((fn) => expect(fn({ query, data })).to.exist),
      removeFn: match((fn) => expect(fn(query)).to.exist),
      getFn,
      updateFn,
      formatFn,
      one,
    });

    await mongodbViewStore({ schema });
    expect(storeFake).to.have.been.calledOnce;
  });
  it("should call with the correct params without domain and in local env", async () => {
    const store = "some-store";
    const storeFake = fake.returns(store);

    const cursorFake = fake.returns({
      eachAsync: async (fn, options) => {
        const view = { a: 1 };
        await fn(view);
        expect(fnFake).to.have.been.calledWith(view);
        expect(options).to.deep.equal({ parallel });
        return foundObjs;
      },
    });

    const foundObjs = {
      cursor: cursorFake,
    };
    const findFake = fake.returns(foundObjs);
    const countFake = fake.returns(count);
    const writeFake = fake.returns(writeResult);
    const removeFake = fake.returns(removeResult);

    const db = {
      store: storeFake,
      find: findFake,
      count: countFake,
      write: writeFake,
      remove: removeFake,
    };
    replace(deps, "db", db);

    const secretFake = fake.returns(password);

    const dateString = "some-date";
    const dateStringFake = fake.returns(dateString);
    replace(deps, "dateString", dateStringFake);

    const viewStoreFake = fake();
    replace(deps, "viewStore", viewStoreFake);

    const getFn = "some-get-fn";
    const updateFn = "some-update-fn";
    const formatFn = "some-format-fn";

    const formattedSchema = "some-formatted-schema";
    const formatSchemaFake = fake.returns(formattedSchema);
    replace(deps, "formatSchema", formatSchemaFake);

    process.env.NODE_ENV = "local";
    await mongodbViewStore({
      schema,
      indexes,
      secretFn: secretFake,
      getFn,
      updateFn,
      formatFn,
    });

    expect(formatSchemaFake).to.have.been.calledWith(schema, "$type");
    expect(storeFake).to.have.been.calledWith({
      name: "views",
      schema: {
        body: formattedSchema,
        headers: {
          _id: false,
          id: {
            $type: String,
            required: true,
            unique: true,
            default: deps.uuid,
          },
          context: {
            $type: {
              root: String,
              domain: String,
              service: String,
              network: String,
              _id: false,
            },
            required: true,
          },
          created: {
            $type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
          modified: {
            $type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
        },
        trace: { $type: Object },
      },
      typeKey: "$type",
      indexes: [
        [{ "headers.id": 1 }],
        [
          { "headers.context.root": 1 },
          { "headers.context.domain": 1 },
          { "headers.context.service": 1 },
          { "headers.context.network": 1 },
        ],
        [{ "body.some-index": 1 }],
      ],
      connection: {
        protocol,
        user,
        password: userPassword,
        host,
        database,
        parameters: {
          authSource: "admin",
          retryWrites: true,
          w: "majority",
        },
        autoIndex: true,
      },
    });
  });
  it("should call with the correct params with no root's in nested objs", async () => {
    const store = "some-store";
    const storeFake = fake.returns(store);

    const cursorFake = fake.returns({
      eachAsync: async (fn, options) => {
        const view = { a: 1 };
        await fn(view);
        expect(fnFake).to.have.been.calledWith(view);
        expect(options).to.deep.equal({ parallel });
        return foundObjs;
      },
    });

    const foundObjs = {
      cursor: cursorFake,
    };
    const findFake = fake.returns(foundObjs);
    const countFake = fake.returns(count);
    const writeFake = fake.returns(writeResult);
    const removeFake = fake.returns(removeResult);

    const db = {
      store: storeFake,
      find: findFake,
      count: countFake,
      write: writeFake,
      remove: removeFake,
    };
    replace(deps, "db", db);

    const secretFake = fake.returns(password);

    const dateString = "some-date";
    const dateStringFake = fake.returns(dateString);
    replace(deps, "dateString", dateStringFake);

    const viewStoreFake = fake();
    replace(deps, "viewStore", viewStoreFake);

    const getFn = "some-get-fn";
    const updateFn = "some-update-fn";
    const formatFn = "some-format-fn";

    const formattedSchema = "some-formatted-schema";
    const formatSchemaFake = fake.returns(formattedSchema);
    replace(deps, "formatSchema", formatSchemaFake);

    const schema = {
      a: 1,
      b: { c: 2 },
      d: { type: String },
      e: { type: [{ type: { type: String } }] },
      f: [{ g: 1 }],
    };
    await mongodbViewStore({
      schema,
      indexes,
      secretFn: secretFake,
      getFn,
      updateFn,
      formatFn,
    });

    expect(formatSchemaFake).to.have.been.calledWith(schema, "$type");
    expect(storeFake).to.have.been.calledWith({
      name: "views",
      schema: {
        body: formattedSchema,
        headers: {
          _id: false,
          id: {
            $type: String,
            required: true,
            unique: true,
            default: deps.uuid,
          },
          context: {
            $type: {
              root: String,
              domain: String,
              service: String,
              network: String,
              _id: false,
            },
            required: true,
          },
          created: {
            $type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
          modified: {
            $type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
        },
        trace: { $type: Object },
      },
      typeKey: "$type",
      indexes: [
        [{ "headers.id": 1 }],
        [
          { "headers.context.root": 1 },
          { "headers.context.domain": 1 },
          { "headers.context.service": 1 },
          { "headers.context.network": 1 },
        ],
        [{ "body.some-index": 1 }],
      ],
      connection: {
        protocol,
        user,
        password,
        host,
        database,
        parameters: {
          authSource: "admin",
          retryWrites: true,
          w: "majority",
        },
        autoIndex: true,
      },
    });
  });
  it("should call with the correct params without fns, one, or upsert", async () => {
    const store = "some-store";
    const storeFake = fake.returns(store);

    const cursorFake = fake.returns({
      eachAsync: async (fn, options) => {
        const view = { a: 1 };
        await fn(view);
        expect(fnFake).to.have.been.calledWith(view);
        expect(options).to.deep.equal({ parallel });
        return foundObjs;
      },
    });

    const foundObjs = {
      cursor: cursorFake,
    };
    const findFake = fake.returns(foundObjs);
    const countFake = fake.returns(count);
    const writeFake = fake.returns(writeResult);
    const removeFake = fake.returns(removeResult);

    const db = {
      store: storeFake,
      find: findFake,
      count: countFake,
      write: writeFake,
      remove: removeFake,
    };
    replace(deps, "db", db);

    const secretFake = fake.returns(password);

    const dateString = "some-date";
    const dateStringFake = fake.returns(dateString);
    replace(deps, "dateString", dateStringFake);

    const viewStoreFake = fake();
    replace(deps, "viewStore", viewStoreFake);

    const formattedSchema = "some-formatted-schema";
    const formatSchemaFake = fake.returns(formattedSchema);
    replace(deps, "formatSchema", formatSchemaFake);

    await mongodbViewStore({ schema, indexes, secretFn: secretFake });

    expect(formatSchemaFake).to.have.been.calledWith(schema, "$type");
    expect(storeFake).to.have.been.calledWith({
      name: "views",
      schema: {
        body: formattedSchema,
        headers: {
          _id: false,
          id: {
            $type: String,
            required: true,
            unique: true,
            default: deps.uuid,
          },
          context: {
            $type: {
              root: String,
              domain: String,
              service: String,
              network: String,
              _id: false,
            },
            required: true,
          },
          created: {
            $type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
          modified: {
            $type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
        },
        trace: { $type: Object },
      },
      typeKey: "$type",
      indexes: [
        [{ "headers.id": 1 }],
        [
          { "headers.context.root": 1 },
          { "headers.context.domain": 1 },
          { "headers.context.service": 1 },
          { "headers.context.network": 1 },
        ],
        [{ "body.some-index": 1 }],
      ],
      connection: {
        protocol,
        user,
        password,
        host,
        database,
        parameters: {
          authSource: "admin",
          retryWrites: true,
          w: "majority",
        },
        autoIndex: true,
      },
    });
    expect(secretFake).to.have.been.calledWith("mongodb-view-store");

    const findFnResult = await viewStoreFake.lastCall.lastArg.findFn({
      query,
      sort,
    });

    expect(findFake).to.have.been.calledWith({
      store,
      query,
      sort,
      options: {
        lean: true,
      },
    });
    expect(findFnResult).to.equal(foundObjs);

    const countFnResult = await viewStoreFake.lastCall.lastArg.countFn({
      query,
    });

    expect(countFake).to.have.been.calledWith({
      store,
      query,
    });
    expect(countFnResult).to.equal(count);

    const steamFnResult = await viewStoreFake.lastCall.lastArg.streamFn({
      query: query2,
      sort: sort2,
      parallel,
      fn: fnFake,
    });

    expect(findFake).to.have.been.calledWith({
      store,
      query: query2,
      sort: sort2,
      options: {
        lean: true,
      },
    });
    expect(steamFnResult).to.equal(foundObjs);

    const writeFnResult = await viewStoreFake.lastCall.lastArg.writeFn({
      query,
      data,
    });
    expect(writeFake).to.have.been.calledWith({
      store,
      query,
      update: {
        $set: data,
      },
      options: {
        lean: true,
        omitUndefined: true,
        upsert: false,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    });
    expect(writeFnResult).to.equal(writeResult);

    const removeFnResult = await viewStoreFake.lastCall.lastArg.removeFn(query);
    expect(removeFake).to.have.been.calledWith({
      store,
      query,
    });
    expect(removeFnResult).to.equal(removeResult);

    expect(viewStoreFake).to.have.been.calledWith({
      streamFn: match(
        (fn) => expect(fn({ query, sort, parallel, fn: fnFake })).to.exist
      ),
      findFn: match((fn) => expect(fn({ query, sort })).to.exist),
      countFn: match((fn) => expect(fn({ query, sort })).to.exist),
      writeFn: match((fn) => expect(fn({ query, data })).to.exist),
      removeFn: match((fn) => expect(fn(query)).to.exist),
    });
    await mongodbViewStore();
    expect(storeFake).to.have.been.calledOnce;
  });
  it("should call with the correct params with mongo style", async () => {
    const store = "some-store";
    const storeFake = fake.returns(store);

    const cursorFake = fake.returns({
      eachAsync: async (fn, options) => {
        const view = { a: 1 };
        await fn(view);
        expect(fnFake).to.have.been.calledWith(view);
        expect(options).to.deep.equal({ parallel });
        return foundObjs;
      },
    });

    const foundObjs = {
      cursor: cursorFake,
    };
    const findFake = fake.returns(foundObjs);
    const countFake = fake.returns(count);
    const writeFake = fake.returns(writeResult);
    const removeFake = fake.returns(removeResult);

    const db = {
      store: storeFake,
      find: findFake,
      count: countFake,
      write: writeFake,
      remove: removeFake,
    };
    replace(deps, "db", db);

    const secretFake = fake.returns(password);

    const dateString = "some-date";
    const dateStringFake = fake.returns(dateString);
    replace(deps, "dateString", dateStringFake);

    const viewStoreFake = fake();
    replace(deps, "viewStore", viewStoreFake);

    const formattedSchema = { a: 1 };
    const formatSchemaFake = fake.returns(formattedSchema);
    replace(deps, "formatSchema", formatSchemaFake);

    await mongodbViewStore({ schema, indexes, secretFn: secretFake });

    expect(formatSchemaFake).to.have.been.calledWith(schema, "$type");
    expect(storeFake).to.have.been.calledWith({
      name: "views",
      schema: {
        body: formattedSchema,
        headers: {
          _id: false,
          id: {
            $type: String,
            required: true,
            unique: true,
            default: deps.uuid,
          },
          context: {
            $type: {
              root: String,
              domain: String,
              service: String,
              network: String,
              _id: false,
            },
            required: true,
          },
          created: {
            $type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
          modified: {
            $type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
        },
        trace: { $type: Object },
      },
      typeKey: "$type",
      indexes: [
        [{ "headers.id": 1 }],
        [
          { "headers.context.root": 1 },
          { "headers.context.domain": 1 },
          { "headers.context.service": 1 },
          { "headers.context.network": 1 },
        ],
        [{ "body.some-index": 1 }],
      ],
      connection: {
        protocol,
        user,
        password,
        host,
        database,
        parameters: {
          authSource: "admin",
          retryWrites: true,
          w: "majority",
        },
        autoIndex: true,
      },
    });
    expect(secretFake).to.have.been.calledWith("mongodb-view-store");

    const findFnResult = await viewStoreFake.lastCall.lastArg.findFn({
      query,
      sort,
    });

    expect(findFake).to.have.been.calledWith({
      store,
      query,
      sort,
      options: {
        lean: true,
      },
    });
    expect(findFnResult).to.equal(foundObjs);

    const countFnResult = await viewStoreFake.lastCall.lastArg.countFn({
      query,
    });

    expect(countFake).to.have.been.calledWith({
      store,
      query,
    });
    expect(countFnResult).to.equal(count);

    const steamFnResult = await viewStoreFake.lastCall.lastArg.streamFn({
      query,
      sort,
      parallel,
      fn: fnFake,
    });

    expect(findFake).to.have.been.calledWith({
      store,
      query,
      sort,
      options: {
        lean: true,
      },
    });
    expect(steamFnResult).to.equal(foundObjs);

    const mongoKey = "$some-mongo-key";
    const plainKey = "some-plain-key";
    const writeFnResult = await viewStoreFake.lastCall.lastArg.writeFn({
      query,
      data: {
        [mongoKey]: { a: 3 },
        [plainKey]: 5,
        $set: { k: 9 },
      },
      upsert,
    });
    expect(writeFake).to.have.been.calledWith({
      store,
      query,
      update: {
        $set: {
          [plainKey]: 5,
          k: 9,
        },
        [mongoKey]: { a: 3 },
      },
      options: {
        lean: true,
        omitUndefined: true,
        upsert,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    });
    expect(writeFnResult).to.equal(writeResult);

    const removeFnResult = await viewStoreFake.lastCall.lastArg.removeFn(query);
    expect(removeFake).to.have.been.calledWith({
      store,
      query,
    });
    expect(removeFnResult).to.equal(removeResult);

    await mongodbViewStore();
    expect(storeFake).to.have.been.calledOnce;
  });
});
