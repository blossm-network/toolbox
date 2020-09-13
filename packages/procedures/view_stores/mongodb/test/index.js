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
const query = { a: 1 };
const sort = { b: 2 };
const sort2 = { c: 3 };
const query2 = { d: 4 };
const count = "some-count";

const writeResult = "some-write-result";
const removeResult = "some-remove-result";
const data = { c: 1 };
const fnFake = fake();
const parallel = "some-parallel";
const one = "some-one";
const group = "some-group";
const groupsLookupFn = "some-group-lookup-fn";

process.env.NAME = name;
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
    process.env.CONTEXT = context;
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

    const formattedSchema = { a: 1 };
    const formatSchemaFake = fake.returns(formattedSchema);
    replace(deps, "formatSchema", formatSchemaFake);

    const queryFn = "some-query-fn";
    const sortFn = "some-sort-fn";
    const updateFn = "some-update-fn";
    const formatFn = "some-format-fn";
    const emptyFn = "some-empty-fn";

    await mongodbViewStore({
      schema,
      indexes,
      secretFn: secretFake,
      queryFn,
      sortFn,
      updateFn,
      formatFn,
      emptyFn,
      one,
      group,
      groupsLookupFn,
    });

    expect(formatSchemaFake).to.have.been.calledWith(schema, "$type");
    expect(storeFake).to.have.been.calledWith({
      name: "views",
      schema: {
        body: {
          a: 1,
        },
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
          groups: {
            $type: [
              {
                root: String,
                service: String,
                network: String,
                _id: false,
              },
            ],
            default: undefined,
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
          {
            "headers.context.root": 1,
            "headers.context.domain": 1,
            "headers.context.service": 1,
            "headers.context.network": 1,
          },
        ],
        [
          {
            "headers.groups.root": 1,
            "headers.groups.service": 1,
            "headers.groups.network": 1,
          },
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
    const select = { c: 3 };
    const skip = "some-skip";
    const findFnResult = await viewStoreFake.lastCall.lastArg.findFn({
      limit,
      select,
      skip,
      query,
      sort,
    });

    expect(findFake).to.have.been.calledWith({
      store,
      query,
      limit,
      select,
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
        upsert: true,
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
      groupsLookupFn,
      queryFn,
      sortFn,
      updateFn,
      formatFn,
      emptyFn,
      one,
      group,
    });

    await mongodbViewStore({ schema });
    expect(storeFake).to.have.been.calledOnce;
  });
  it("should call with the correct params without domain and in local env, and with text and text index", async () => {
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
    const aggregateFake = fake.returns(foundObjs);
    const countFake = fake.returns(count);
    const writeFake = fake.returns(writeResult);
    const removeFake = fake.returns(removeResult);

    const db = {
      store: storeFake,
      aggregate: aggregateFake,
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

    const queryFn = "some-query-fn";
    const sortFn = "some-sort-fn";
    const updateFn = "some-update-fn";
    const formatFn = "some-format-fn";
    const emptyFn = "some-empty-fn";

    const formattedSchema = { a: 1 };
    const formatSchemaFake = fake.returns(formattedSchema);
    replace(deps, "formatSchema", formatSchemaFake);

    process.env.NODE_ENV = "local";
    await mongodbViewStore({
      schema,
      indexes: [
        ...indexes,
        [{ some: "text", "some.id": "text" }, { weights: { some: 10 } }],
      ],
      secretFn: secretFake,
      queryFn,
      sortFn,
      updateFn,
      formatFn,
      emptyFn,
    });

    expect(formatSchemaFake).to.have.been.calledWith(schema, "$type");
    expect(storeFake).to.have.been.calledWith({
      name: "views",
      schema: {
        body: {
          a: 1,
        },
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
          groups: {
            $type: [
              {
                root: String,
                service: String,
                network: String,
                _id: false,
              },
            ],
            default: undefined,
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
          {
            "headers.context.root": 1,
            "headers.context.domain": 1,
            "headers.context.service": 1,
            "headers.context.network": 1,
          },
        ],
        [
          {
            "headers.groups.root": 1,
            "headers.groups.service": 1,
            "headers.groups.network": 1,
          },
        ],
        [{ "body.some-index": 1 }],
        [{ "body.some": 1 }],
        [
          { "body.some": "text", "body.some.id": "text", "headers.id": "text" },
          { name: "text-search", weights: { "body.some": 10 } },
        ],
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

    const text = "some-text";
    const findFnResult = await viewStoreFake.lastCall.lastArg.findFn({
      query,
      text,
    });

    expect(aggregateFake).to.have.been.calledWith({
      store,
      query: {
        ...query,
        $or: [
          {
            $text: { $search: text },
          },
          {
            "body.some": {
              $regex: "some-text",
              $options: "i",
            },
          },
        ],
      },
      select: {
        score: {
          $add: [
            { $meta: "textScore" },
            { $cond: [{ $eq: ["$body.some", "some-text"] }, 10, 0] },
          ],
        },
        body: 1,
        headers: 1,
        trace: 1,
      },
      sort: { score: -1 },
    });
    expect(findFnResult).to.equal(foundObjs);

    const countFnResult = await viewStoreFake.lastCall.lastArg.countFn({
      query,
      text,
    });

    expect(countFake).to.have.been.calledWith({
      store,
      query: {
        ...query,
        $text: { $search: text },
      },
    });
    expect(countFnResult).to.equal(count);

    const steamFnResult = await viewStoreFake.lastCall.lastArg.streamFn({
      text,
      query: query2,
      sort: sort2,
      parallel,
      fn: fnFake,
    });

    expect(aggregateFake).to.have.been.calledWith({
      store,
      query: {
        ...query2,
        $or: [
          {
            $text: { $search: text },
          },
          {
            "body.some": {
              $regex: "some-text",
              $options: "i",
            },
          },
        ],
      },
      select: {
        score: {
          $add: [
            { $meta: "textScore" },
            { $cond: [{ $eq: ["$body.some", "some-text"] }, 10, 0] },
          ],
        },
        body: 1,
        headers: 1,
        trace: 1,
      },
      sort: { c: 3, score: -1 },
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
        upsert: true,
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
  it("should call with uuid text", async () => {
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
    const aggregateFake = fake.returns(foundObjs);
    const countFake = fake.returns(count);
    const writeFake = fake.returns(writeResult);
    const removeFake = fake.returns(removeResult);

    const db = {
      store: storeFake,
      aggregate: aggregateFake,
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

    const queryFn = "some-query-fn";
    const sortFn = "some-sort-fn";
    const updateFn = "some-update-fn";
    const formatFn = "some-format-fn";
    const emptyFn = "some-empty-fn";

    const formattedSchema = { a: 1 };
    const formatSchemaFake = fake.returns(formattedSchema);
    replace(deps, "formatSchema", formatSchemaFake);

    process.env.NODE_ENV = "local";
    await mongodbViewStore({
      schema,
      indexes: [
        ...indexes,
        [{ some: "text", "some.id": "text" }, { weights: { some: 10 } }],
      ],
      secretFn: secretFake,
      queryFn,
      sortFn,
      updateFn,
      formatFn,
      emptyFn,
    });

    expect(formatSchemaFake).to.have.been.calledWith(schema, "$type");
    expect(storeFake).to.have.been.calledWith({
      name: "views",
      schema: {
        body: {
          a: 1,
        },
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
          groups: {
            $type: [
              {
                root: String,
                service: String,
                network: String,
                _id: false,
              },
            ],
            default: undefined,
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
          {
            "headers.context.root": 1,
            "headers.context.domain": 1,
            "headers.context.service": 1,
            "headers.context.network": 1,
          },
        ],
        [
          {
            "headers.groups.root": 1,
            "headers.groups.service": 1,
            "headers.groups.network": 1,
          },
        ],
        [{ "body.some-index": 1 }],
        [{ "body.some": 1 }],
        [
          { "body.some": "text", "body.some.id": "text", "headers.id": "text" },
          { name: "text-search", weights: { "body.some": 10 } },
        ],
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

    const text = "945c24c3-ae66-4759-a1c7-1079bac8eb5e";
    const findFnResult = await viewStoreFake.lastCall.lastArg.findFn({
      query,
      text,
    });

    expect(aggregateFake).to.have.been.calledWith({
      store,
      query: {
        ...query,
        $or: [
          {
            $text: { $search: '"945c24c3-ae66-4759-a1c7-1079bac8eb5e"' },
          },
        ],
      },
      select: {
        score: {
          $add: [
            { $meta: "textScore" },
            {
              $cond: [
                { $eq: ["$body.some", "945c24c3-ae66-4759-a1c7-1079bac8eb5e"] },
                10,
                0,
              ],
            },
          ],
        },
        body: 1,
        headers: 1,
        trace: 1,
      },
      sort: { score: -1 },
    });
    expect(findFnResult).to.equal(foundObjs);

    const countFnResult = await viewStoreFake.lastCall.lastArg.countFn({
      query,
      text,
    });

    expect(countFake).to.have.been.calledWith({
      store,
      query: {
        ...query,
        $text: { $search: text },
      },
    });
    expect(countFnResult).to.equal(count);

    const steamFnResult = await viewStoreFake.lastCall.lastArg.streamFn({
      text,
      query: query2,
      sort: sort2,
      parallel,
      fn: fnFake,
    });

    expect(aggregateFake).to.have.been.calledWith({
      store,
      query: {
        ...query2,
        $or: [
          {
            $text: { $search: '"945c24c3-ae66-4759-a1c7-1079bac8eb5e"' },
          },
        ],
      },
      select: {
        score: {
          $add: [
            { $meta: "textScore" },
            {
              $cond: [
                { $eq: ["$body.some", "945c24c3-ae66-4759-a1c7-1079bac8eb5e"] },
                10,
                0,
              ],
            },
          ],
        },
        body: 1,
        headers: 1,
        trace: 1,
      },
      sort: { c: 3, score: -1 },
    });
    expect(steamFnResult).to.equal(foundObjs);

    const writeFnResult = await viewStoreFake.lastCall.lastArg.writeFn({
      query,
      data: {
        ...data,
        "some.$.key": "something",
      },
    });
    expect(writeFake).to.have.been.calledWith({
      store,
      query,
      update: {
        $set: {
          ...data,
          "some.$.key": "something",
        },
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

    await mongodbViewStore();
    expect(storeFake).to.have.been.calledOnce;
  });
  it("should call with the correct params with no root's in nested objs, with sorts", async () => {
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

    const queryFn = "some-query-fn";
    const sortFn = "some-sort-fn";
    const updateFn = "some-update-fn";
    const formatFn = "some-format-fn";
    const emptyFn = "some-empty-fn";

    const formattedSchema = { c: 3 };
    const formatSchemaFake = fake.returns(formattedSchema);
    replace(deps, "formatSchema", formatSchemaFake);

    const schema = {
      a: 1,
      b: { c: 2 },
      d: { type: String },
      e: { type: [{ type: { type: String } }] },
      f: [{ g: 1 }],
    };

    const sorts = [
      { "some-index": 1 },
      { "some-other-index": 1, "another-index": -1 },
    ];

    await mongodbViewStore({
      schema,
      indexes,
      sorts,
      secretFn: secretFake,
      queryFn,
      sortFn,
      updateFn,
      formatFn,
      emptyFn,
    });

    expect(formatSchemaFake).to.have.been.calledWith(schema, "$type");
    expect(storeFake).to.have.been.calledWith({
      name: "views",
      schema: {
        body: { c: 3 },
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
          groups: {
            $type: [
              {
                root: String,
                service: String,
                network: String,
                _id: false,
              },
            ],
            default: undefined,
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
          {
            "headers.context.root": 1,
            "headers.context.domain": 1,
            "headers.context.service": 1,
            "headers.context.network": 1,
          },
        ],
        [
          {
            "headers.context.root": 1,
            "headers.context.domain": 1,
            "headers.context.service": 1,
            "headers.context.network": 1,
            "body.some-index": 1,
          },
        ],
        [
          {
            "headers.context.root": 1,
            "headers.context.domain": 1,
            "headers.context.service": 1,
            "headers.context.network": 1,
            "body.some-other-index": 1,
            "body.another-index": -1,
          },
        ],
        [
          {
            "headers.groups.root": 1,
            "headers.groups.service": 1,
            "headers.groups.network": 1,
          },
        ],
        [{ "body.some-index": 1 }],
        [
          {
            "body.some-index": 1,
            "body.some-other-index": 1,
            "body.another-index": -1,
          },
        ],
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
  it("should call with the correct params without fns, one, group, or upsert. With text and select. No env context", async () => {
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
    const aggregateFake = fake.returns(foundObjs);
    const countFake = fake.returns(count);
    const writeFake = fake.returns(writeResult);
    const removeFake = fake.returns(removeResult);

    const db = {
      store: storeFake,
      aggregate: aggregateFake,
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

    const formattedSchema = { b: 2 };
    const formatSchemaFake = fake.returns(formattedSchema);
    replace(deps, "formatSchema", formatSchemaFake);

    delete process.env.CONTEXT;
    await mongodbViewStore({
      schema,
      indexes: [...indexes, [{ some: "text" }]],
      secretFn: secretFake,
      groupsLookupFn,
    });

    expect(formatSchemaFake).to.have.been.calledWith(schema, "$type");
    expect(storeFake).to.have.been.calledWith({
      name: "views",
      schema: {
        body: { b: 2 },
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
          groups: {
            $type: [
              {
                root: String,
                service: String,
                network: String,
                _id: false,
              },
            ],
            default: undefined,
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
          {
            "headers.groups.root": 1,
            "headers.groups.service": 1,
            "headers.groups.network": 1,
          },
        ],
        [{ "body.some-index": 1 }],
        [{ "body.some": 1 }],
        [
          { "body.some": "text", "headers.id": "text" },
          { name: "text-search" },
        ],
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

    const text = "some-text";
    const select = { some: "select" };
    const findFnResult = await viewStoreFake.lastCall.lastArg.findFn({
      query,
      text,
      select,
    });

    expect(aggregateFake).to.have.been.calledWith({
      store,
      query: {
        ...query,
        $or: [
          {
            $text: { $search: text },
          },
          {
            "body.some": {
              $regex: "some-text",
              $options: "i",
            },
          },
        ],
      },
      select: {
        some: "select",
        "body.some": 1,
        score: {
          $add: [
            { $meta: "textScore" },
            { $cond: [{ $eq: ["$body.some", "some-text"] }, 10, 0] },
          ],
        },
      },
      sort: { score: -1 },
    });
    expect(findFnResult).to.equal(foundObjs);

    const countFnResult = await viewStoreFake.lastCall.lastArg.countFn({
      query,
      text,
    });

    expect(countFake).to.have.been.calledWith({
      store,
      query: {
        ...query,
        $text: { $search: text },
      },
    });
    expect(countFnResult).to.equal(count);

    const steamFnResult = await viewStoreFake.lastCall.lastArg.streamFn({
      text,
      query: query2,
      sort: sort2,
      select,
      parallel,
      fn: fnFake,
    });

    expect(aggregateFake).to.have.been.calledWith({
      store,
      query: {
        ...query2,
        $or: [
          {
            $text: { $search: text },
          },
          {
            "body.some": { $regex: "some-text", $options: "i" },
          },
        ],
      },
      select: {
        some: "select",
        "body.some": 1,
        score: {
          $add: [
            { $meta: "textScore" },
            { $cond: [{ $eq: ["$body.some", "some-text"] }, 10, 0] },
          ],
        },
      },
      sort: { c: 3, score: -1 },
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
        upsert: true,
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
        (fn) => expect(fn({ query, text, sort, parallel, fn: fnFake })).to.exist
      ),
      findFn: match((fn) => expect(fn({ query, text, sort })).to.exist),
      countFn: match((fn) => expect(fn({ query, sort })).to.exist),
      writeFn: match((fn) => expect(fn({ query, data })).to.exist),
      removeFn: match((fn) => expect(fn(query)).to.exist),
      groupsLookupFn,
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
        body: { a: 1 },
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
          groups: {
            $type: [
              {
                root: String,
                service: String,
                network: String,
                _id: false,
              },
            ],
            default: undefined,
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
          {
            "headers.context.root": 1,
            "headers.context.domain": 1,
            "headers.context.service": 1,
            "headers.context.network": 1,
          },
        ],
        [
          {
            "headers.groups.root": 1,
            "headers.groups.service": 1,
            "headers.groups.network": 1,
          },
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
        upsert: true,
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
