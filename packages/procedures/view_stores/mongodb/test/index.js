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
const domain = "some-domain";
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

// const foundObj = "some-found-obj";
const writeResult = "some-write-result";
const removeResult = "some-remove-result";
const data = { c: 1 };
const fnFake = fake();
const parallel = "some-parallel";

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
    process.env.DOMAIN = domain;
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const store = "some-store";
    const storeFake = fake.returns(store);
    // const findOneFake = fake.returns(foundObj);

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
    const writeFake = fake.returns(writeResult);
    const removeFake = fake.returns(removeResult);

    const db = {
      store: storeFake,
      // findOne: findOneFake,
      find: findFake,
      write: writeFake,
      remove: removeFake,
    };
    replace(deps, "db", db);

    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);

    const dateString = "some-date";
    const dateStringFake = fake.returns(dateString);
    replace(deps, "dateString", dateStringFake);

    const viewStoreFake = fake();
    replace(deps, "viewStore", viewStoreFake);

    const getFn = "some-get-fn";
    // const postFn = "some-post-fn";
    const putFn = "some-put-fn";

    await mongodbViewStore({
      schema,
      indexes,
      getFn,
      // postFn,
      putFn,
    });

    expect(storeFake).to.have.been.calledWith({
      name: `${context}.${domain}.${name}`,
      schema: {
        body: {
          a: 1,
          b: {
            c: 2,
            _id: false,
          },
          _id: false,
        },
        headers: {
          _id: false,
          root: { type: String, required: true, unique: true },
          [context]: {
            root: String,
            service: String,
            network: String,
            _id: false,
          },
          [domain]: {
            root: String,
            service: String,
            network: String,
            _id: false,
          },
          created: {
            type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
          modified: {
            type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
        },
      },
      indexes: [
        [{ root: 1 }],
        [
          { "headers.some-context.root": 1 },
          { "headers.some-context.service": 1 },
          { "headers.some-context.network": 1 },
        ],
        [
          { "headers.some-domain.root": 1 },
          { "headers.some-domain.service": 1 },
          { "headers.some-domain.network": 1 },
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

    const root = "some-root";
    // const findOneFnResult = await viewStoreFake.lastCall.lastArg.findOneFn({
    //   root
    // });
    // expect(findOneFake).to.have.been.calledWith({
    //   store,
    //   query: { "headers.root": root },
    //   options: { lean: true }
    // });
    // expect(findOneFnResult).to.equal(foundObj);

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
      root,
      data,
    });
    expect(writeFake).to.have.been.calledWith({
      store,
      query: { "headers.root": root },
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
      // findOneFn: match(fn => expect(fn({ root })).to.exist),
      writeFn: match((fn) => expect(fn({ root, data })).to.exist),
      removeFn: match((fn) => expect(fn(query)).to.exist),
      getFn,
      // postFn,
      putFn,
    });

    await mongodbViewStore({ schema });
    expect(storeFake).to.have.been.calledOnce;
  });
  it("should call with the correct params without domain", async () => {
    const store = "some-store";
    const storeFake = fake.returns(store);
    // const findOneFake = fake.returns(foundObj);

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
    const writeFake = fake.returns(writeResult);
    const removeFake = fake.returns(removeResult);

    const db = {
      store: storeFake,
      // findOne: findOneFake,
      find: findFake,
      write: writeFake,
      remove: removeFake,
    };
    replace(deps, "db", db);

    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);

    const dateString = "some-date";
    const dateStringFake = fake.returns(dateString);
    replace(deps, "dateString", dateStringFake);

    const viewStoreFake = fake();
    replace(deps, "viewStore", viewStoreFake);

    const getFn = "some-get-fn";
    // const postFn = "some-post-fn";
    const putFn = "some-put-fn";

    delete process.env.DOMAIN;
    await mongodbViewStore({
      schema,
      indexes,
      getFn,
      // postFn,
      putFn,
    });

    expect(storeFake).to.have.been.calledWith({
      name: `${context}.${name}`,
      schema: {
        body: {
          a: 1,
          b: {
            c: 2,
            _id: false,
          },
          _id: false,
        },
        headers: {
          _id: false,
          root: { type: String, required: true, unique: true },
          [context]: {
            root: String,
            service: String,
            network: String,
            _id: false,
          },
          created: {
            type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
          modified: {
            type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
        },
      },
      indexes: [
        [{ root: 1 }],
        [
          { "headers.some-context.root": 1 },
          { "headers.some-context.service": 1 },
          { "headers.some-context.network": 1 },
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
  it("should call with the correct params with no root's in nested objs", async () => {
    const store = "some-store";
    const storeFake = fake.returns(store);
    // const findOneFake = fake.returns(foundObj);

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
    const writeFake = fake.returns(writeResult);
    const removeFake = fake.returns(removeResult);

    const db = {
      store: storeFake,
      // findOne: findOneFake,
      find: findFake,
      write: writeFake,
      remove: removeFake,
    };
    replace(deps, "db", db);

    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);

    const dateString = "some-date";
    const dateStringFake = fake.returns(dateString);
    replace(deps, "dateString", dateStringFake);

    const viewStoreFake = fake();
    replace(deps, "viewStore", viewStoreFake);

    const getFn = "some-get-fn";
    // const postFn = "some-post-fn";
    const putFn = "some-put-fn";

    const schema = {
      a: 1,
      b: { c: 2 },
      d: { type: String },
      e: { type: [{ type: { type: String } }] },
      f: [{ g: 1 }],
    };
    await mongodbViewStore({ schema, indexes, getFn, /* postFn, */ putFn });

    expect(storeFake).to.have.been.calledWith({
      name: `${context}.${domain}.${name}`,
      schema: {
        body: {
          a: 1,
          b: {
            c: 2,
            _id: false,
          },
          d: { type: String },
          e: { type: [{ type: { type: String }, _id: false }] },
          f: [{ g: 1, _id: false }],
          _id: false,
        },
        headers: {
          _id: false,
          root: { type: String, required: true, unique: true },
          [context]: {
            root: String,
            service: String,
            network: String,
            _id: false,
          },
          [domain]: {
            root: String,
            service: String,
            network: String,
            _id: false,
          },
          created: {
            type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
          modified: {
            type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
        },
      },
      indexes: [
        [{ root: 1 }],
        [
          { "headers.some-context.root": 1 },
          { "headers.some-context.service": 1 },
          { "headers.some-context.network": 1 },
        ],
        [
          { "headers.some-domain.root": 1 },
          { "headers.some-domain.service": 1 },
          { "headers.some-domain.network": 1 },
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
  it("should call with the correct params without fns", async () => {
    const store = "some-store";
    const storeFake = fake.returns(store);
    // const findOneFake = fake.returns(foundObj);

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
    const writeFake = fake.returns(writeResult);
    const removeFake = fake.returns(removeResult);

    const db = {
      store: storeFake,
      // findOne: findOneFake,
      find: findFake,
      write: writeFake,
      remove: removeFake,
    };
    replace(deps, "db", db);

    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);

    const dateString = "some-date";
    const dateStringFake = fake.returns(dateString);
    replace(deps, "dateString", dateStringFake);

    const viewStoreFake = fake();
    replace(deps, "viewStore", viewStoreFake);

    await mongodbViewStore({ schema, indexes });

    expect(storeFake).to.have.been.calledWith({
      name: `${context}.${domain}.${name}`,
      schema: {
        body: {
          a: 1,
          b: {
            c: 2,
            _id: false,
          },
          _id: false,
        },
        headers: {
          _id: false,
          root: { type: String, required: true, unique: true },
          [context]: {
            root: String,
            service: String,
            network: String,
            _id: false,
          },
          [domain]: {
            root: String,
            service: String,
            network: String,
            _id: false,
          },
          created: {
            type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
          modified: {
            type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
        },
      },
      indexes: [
        [{ root: 1 }],
        [
          { "headers.some-context.root": 1 },
          { "headers.some-context.service": 1 },
          { "headers.some-context.network": 1 },
        ],
        [
          { "headers.some-domain.root": 1 },
          { "headers.some-domain.service": 1 },
          { "headers.some-domain.network": 1 },
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

    expect(storeFake).to.have.been.calledWith({
      name: `${context}.${domain}.${name}`,
      schema: {
        body: {
          a: 1,
          b: {
            c: 2,
            _id: false,
          },
          _id: false,
        },
        headers: {
          _id: false,
          root: { type: String, required: true, unique: true },
          [context]: {
            root: String,
            service: String,
            network: String,
            _id: false,
          },
          [domain]: {
            root: String,
            service: String,
            network: String,
            _id: false,
          },
          created: {
            type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
          modified: {
            type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
        },
      },
      indexes: [
        [{ root: 1 }],
        [
          { "headers.some-context.root": 1 },
          { "headers.some-context.service": 1 },
          { "headers.some-context.network": 1 },
        ],
        [
          { "headers.some-domain.root": 1 },
          { "headers.some-domain.service": 1 },
          { "headers.some-domain.network": 1 },
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

    const root = "some-root";
    // const findOneFnResult = await viewStoreFake.lastCall.lastArg.findOneFn({
    //   root
    // });
    // expect(findOneFake).to.have.been.calledWith({
    //   store,
    //   query: { "headers.root": root },
    //   options: { lean: true }
    // });
    // expect(findOneFnResult).to.equal(foundObj);

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
      root,
      data,
    });
    expect(writeFake).to.have.been.calledWith({
      store,
      query: { "headers.root": root },
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
      // findOneFn: match(fn => expect(fn({ root })).to.exist),
      writeFn: match((fn) => expect(fn({ root, data })).to.exist),
      removeFn: match((fn) => expect(fn({ root })).to.exist),
    });
    await mongodbViewStore();
    expect(storeFake).to.have.been.calledOnce;
  });
  it("should call with the correct params with mongo style", async () => {
    const store = "some-store";
    const storeFake = fake.returns(store);
    // const findOneFake = fake.returns(foundObj);

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
    const writeFake = fake.returns(writeResult);
    const removeFake = fake.returns(removeResult);

    const db = {
      store: storeFake,
      // findOne: findOneFake,
      find: findFake,
      write: writeFake,
      remove: removeFake,
    };
    replace(deps, "db", db);

    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);

    const dateString = "some-date";
    const dateStringFake = fake.returns(dateString);
    replace(deps, "dateString", dateStringFake);

    const viewStoreFake = fake();
    replace(deps, "viewStore", viewStoreFake);

    await mongodbViewStore({ schema, indexes });

    expect(storeFake).to.have.been.calledWith({
      name: `${context}.${domain}.${name}`,
      schema: {
        body: {
          a: 1,
          b: {
            c: 2,
            _id: false,
          },
          _id: false,
        },
        headers: {
          _id: false,
          root: { type: String, required: true, unique: true },
          [context]: {
            root: String,
            service: String,
            network: String,
            _id: false,
          },
          [domain]: {
            root: String,
            service: String,
            network: String,
            _id: false,
          },
          created: {
            type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
          modified: {
            type: Date,
            required: true,
            default: match((fn) => {
              const date = fn();
              return date == dateString;
            }),
          },
        },
      },
      indexes: [
        [{ root: 1 }],
        [
          { "headers.some-context.root": 1 },
          { "headers.some-context.service": 1 },
          { "headers.some-context.network": 1 },
        ],
        [
          { "headers.some-domain.root": 1 },
          { "headers.some-domain.service": 1 },
          { "headers.some-domain.network": 1 },
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

    const root = "some-root";
    // const findOneFnResult = await viewStoreFake.lastCall.lastArg.findOneFn({
    //   root
    // });
    // expect(findOneFake).to.have.been.calledWith({
    //   store,
    //   query: { "headers.root": root },
    //   options: { lean: true }
    // });
    // expect(findOneFnResult).to.equal(foundObj);

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
      root,
      data: {
        [mongoKey]: { a: 3 },
        [plainKey]: 5,
        $set: { k: 9 },
      },
    });
    expect(writeFake).to.have.been.calledWith({
      store,
      query: { "headers.root": root },
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
