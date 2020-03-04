const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, match, useFakeTimers } = require("sinon");

const deps = require("../deps");

let clock;

const now = new Date();

const schema = { a: 1, b: { c: 2 } };
const indexes = ["some-index"];

const protocol = "some-db-protocol";
const domain = "some-domain";
const name = "some-name";
const user = "some-db-user";
const userPassword = "some-db-user-password";
const host = "some-host";
const database = "some-db";
const password = "some-password";
const root = "some-root";
const query = "some-query";
const sort = "some-sort";
const sort2 = "some-other-sort";
const query2 = "some-other-query";

const foundObj = "some-found-obj";
const writeResult = "some-write-result";
const removeResult = "some-remove-result";
const data = { c: 1 };
const fnFake = fake();
const parallel = "some-parallel";

process.env.DOMAIN = domain;
process.env.NAME = name;
process.env.MONGODB_PROTOCOL = protocol;
process.env.MONGODB_USER = user;
process.env.MONGODB_USER_PASSWORD = userPassword;
process.env.MONGODB_HOST = host;
process.env.MONGODB_DATABASE = database;

describe("View store", () => {
  beforeEach(() => {
    delete require.cache[require.resolve("..")];
    process.env.NODE_ENV = "some-env";
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const mongodbViewStore = require("..");
    const store = "some-store";
    const storeFake = fake.returns(store);
    const findOneFake = fake.returns(foundObj);

    const cursorFake = fake.returns({
      eachAsync: async (fn, options) => {
        const view = { a: 1 };
        await fn(view);
        expect(fnFake).to.have.been.calledWith(view);
        expect(options).to.deep.equal({ parallel });
        return foundObjs;
      }
    });

    const foundObjs = {
      cursor: cursorFake
    };
    const findFake = fake.returns(foundObjs);
    const writeFake = fake.returns(writeResult);
    const removeFake = fake.returns(removeResult);

    const db = {
      store: storeFake,
      findOne: findOneFake,
      find: findFake,
      write: writeFake,
      remove: removeFake
    };
    replace(deps, "db", db);

    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);

    const stringDate = "some-date";
    const stringDateFake = fake.returns(stringDate);
    replace(deps, "stringDate", stringDateFake);

    const viewStoreFake = fake();
    replace(deps, "viewStore", viewStoreFake);

    const getFn = "some-get-fn";
    const postFn = "some-post-fn";
    const putFn = "some-put-fn";

    await mongodbViewStore({
      schema,
      indexes,
      getFn,
      postFn,
      putFn
    });

    expect(storeFake).to.have.been.calledWith({
      name: `${domain}.${name}`,
      schema: {
        a: 1,
        b: {
          c: 2,
          _id: false
        },
        root: { type: String, required: true },
        id: { type: String, required: true, unique: true },
        created: {
          type: Date,
          required: true,
          default: match(fn => {
            const date = fn();
            return date == stringDate;
          })
        },
        modified: {
          type: Date,
          required: true,
          default: match(fn => {
            const date = fn();
            return date == stringDate;
          })
        }
      },
      indexes: [
        [{ id: 1 }],
        [{ root: 1 }],
        [{ created: 1 }],
        [{ modified: 1 }],
        "some-index"
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
          w: "majority"
        },
        autoIndex: true
      }
    });
    expect(secretFake).to.have.been.calledWith("mongodb");

    const id = "some-id";
    const findOneFnResult = await viewStoreFake.lastCall.lastArg.findOneFn({
      id
    });
    expect(findOneFake).to.have.been.calledWith({
      store,
      query: { id },
      options: { lean: true }
    });
    expect(findOneFnResult).to.equal(foundObj);

    const findFnResult = await viewStoreFake.lastCall.lastArg.findFn({
      query,
      sort
    });

    expect(findFake).to.have.been.calledWith({
      store,
      query,
      sort,
      options: {
        lean: true
      }
    });
    expect(findFnResult).to.equal(foundObjs);

    const steamFnResult = await viewStoreFake.lastCall.lastArg.streamFn({
      query: query2,
      sort: sort2,
      parallel,
      fn: fnFake
    });

    expect(findFake).to.have.been.calledWith({
      store,
      query: query2,
      sort: sort2,
      options: {
        lean: true
      }
    });
    expect(steamFnResult).to.equal(foundObjs);

    const writeFnResult = await viewStoreFake.lastCall.lastArg.writeFn({
      id,
      data
    });
    expect(writeFake).to.have.been.calledWith({
      store,
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
    expect(writeFnResult).to.equal(writeResult);

    const removeFnResult = await viewStoreFake.lastCall.lastArg.removeFn(query);
    expect(removeFake).to.have.been.calledWith({
      store,
      query
    });
    expect(removeFnResult).to.equal(removeResult);

    expect(viewStoreFake).to.have.been.calledWith({
      streamFn: match(
        fn => expect(fn({ query, sort, parallel, fn: fnFake })).to.exist
      ),
      findFn: match(fn => expect(fn({ query, sort })).to.exist),
      findOneFn: match(fn => expect(fn({ id })).to.exist),
      writeFn: match(fn => expect(fn({ id, data })).to.exist),
      removeFn: match(fn => expect(fn(query)).to.exist),
      getFn,
      postFn,
      putFn
    });

    await mongodbViewStore();
    expect(storeFake).to.have.been.calledOnce;
  });
  it("should call with the correct params with no root's in nested objs", async () => {
    const mongodbViewStore = require("..");
    const store = "some-store";
    const storeFake = fake.returns(store);
    const findOneFake = fake.returns(foundObj);

    const cursorFake = fake.returns({
      eachAsync: async (fn, options) => {
        const view = { a: 1 };
        await fn(view);
        expect(fnFake).to.have.been.calledWith(view);
        expect(options).to.deep.equal({ parallel });
        return foundObjs;
      }
    });

    const foundObjs = {
      cursor: cursorFake
    };
    const findFake = fake.returns(foundObjs);
    const writeFake = fake.returns(writeResult);
    const removeFake = fake.returns(removeResult);

    const db = {
      store: storeFake,
      findOne: findOneFake,
      find: findFake,
      write: writeFake,
      remove: removeFake
    };
    replace(deps, "db", db);

    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);

    const stringDate = "some-date";
    const stringDateFake = fake.returns(stringDate);
    replace(deps, "stringDate", stringDateFake);

    const viewStoreFake = fake();
    replace(deps, "viewStore", viewStoreFake);

    const getFn = "some-get-fn";
    const postFn = "some-post-fn";
    const putFn = "some-put-fn";

    const schema = {
      a: 1,
      b: { c: 2 },
      d: { type: String },
      e: { type: [{ type: { type: String } }] },
      f: [{ g: 1 }]
    };
    await mongodbViewStore({ schema, indexes, getFn, postFn, putFn });

    expect(storeFake).to.have.been.calledWith({
      name: `${domain}.${name}`,
      schema: {
        a: 1,
        b: {
          c: 2,
          _id: false
        },
        d: { type: String },
        e: { type: [{ type: { type: String }, _id: false }] },
        f: [{ g: 1, _id: false }],
        root: { type: String, required: true },
        id: { type: String, required: true, unique: true },
        created: {
          type: Date,
          required: true,
          default: match(fn => {
            const date = fn();
            return date == stringDate;
          })
        },
        modified: {
          type: Date,
          required: true,
          default: match(fn => {
            const date = fn();
            return date == stringDate;
          })
        }
      },
      indexes: [
        [{ id: 1 }],
        [{ root: 1 }],
        [{ created: 1 }],
        [{ modified: 1 }],
        "some-index"
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
          w: "majority"
        },
        autoIndex: true
      }
    });
  });
  it("should call with the correct params without fns", async () => {
    const mongodbViewStore = require("..");
    const store = "some-store";
    const storeFake = fake.returns(store);
    const findOneFake = fake.returns(foundObj);

    const cursorFake = fake.returns({
      eachAsync: async (fn, options) => {
        const view = { a: 1 };
        await fn(view);
        expect(fnFake).to.have.been.calledWith(view);
        expect(options).to.deep.equal({ parallel });
        return foundObjs;
      }
    });

    const foundObjs = {
      cursor: cursorFake
    };
    const findFake = fake.returns(foundObjs);
    const writeFake = fake.returns(writeResult);
    const removeFake = fake.returns(removeResult);

    const db = {
      store: storeFake,
      findOne: findOneFake,
      find: findFake,
      write: writeFake,
      remove: removeFake
    };
    replace(deps, "db", db);

    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);

    const stringDate = "some-date";
    const stringDateFake = fake.returns(stringDate);
    replace(deps, "stringDate", stringDateFake);

    const viewStoreFake = fake();
    replace(deps, "viewStore", viewStoreFake);

    await mongodbViewStore({ schema, indexes });

    expect(storeFake).to.have.been.calledWith({
      name: `${domain}.${name}`,
      schema: {
        a: 1,
        b: {
          c: 2,
          _id: false
        },
        root: { type: String, required: true },
        id: { type: String, required: true, unique: true },
        created: {
          type: Date,
          required: true,
          default: match(fn => {
            const date = fn();
            return date == stringDate;
          })
        },
        modified: {
          type: Date,
          required: true,
          default: match(fn => {
            const date = fn();
            return date == stringDate;
          })
        }
      },
      indexes: [
        [{ id: 1 }],
        [{ root: 1 }],
        [{ created: 1 }],
        [{ modified: 1 }],
        "some-index"
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
          w: "majority"
        },
        autoIndex: true
      }
    });
    expect(secretFake).to.have.been.calledWith("mongodb");

    expect(storeFake).to.have.been.calledWith({
      name: `${domain}.${name}`,
      schema: {
        a: 1,
        b: {
          c: 2,
          _id: false
        },
        root: { type: String, required: true },
        id: { type: String, required: true, unique: true },
        created: {
          type: Date,
          required: true,
          default: match(fn => {
            const date = fn();
            return date == stringDate;
          })
        },
        modified: {
          type: Date,
          required: true,
          default: match(fn => {
            const date = fn();
            return date == stringDate;
          })
        }
      },
      indexes: [
        [{ id: 1 }],
        [{ root: 1 }],
        [{ created: 1 }],
        [{ modified: 1 }],
        "some-index"
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
          w: "majority"
        },
        autoIndex: true
      }
    });
    expect(secretFake).to.have.been.calledWith("mongodb");

    const id = "some-id";
    const findOneFnResult = await viewStoreFake.lastCall.lastArg.findOneFn({
      id
    });
    expect(findOneFake).to.have.been.calledWith({
      store,
      query: { id },
      options: { lean: true }
    });
    expect(findOneFnResult).to.equal(foundObj);

    const findFnResult = await viewStoreFake.lastCall.lastArg.findFn({
      query,
      sort
    });

    expect(findFake).to.have.been.calledWith({
      store,
      query,
      sort,
      options: {
        lean: true
      }
    });
    expect(findFnResult).to.equal(foundObjs);

    const steamFnResult = await viewStoreFake.lastCall.lastArg.streamFn({
      query: query2,
      sort: sort2,
      parallel,
      fn: fnFake
    });

    expect(findFake).to.have.been.calledWith({
      store,
      query: query2,
      sort: sort2,
      options: {
        lean: true
      }
    });
    expect(steamFnResult).to.equal(foundObjs);

    const writeFnResult = await viewStoreFake.lastCall.lastArg.writeFn({
      id,
      data
    });
    expect(writeFake).to.have.been.calledWith({
      store,
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
    expect(writeFnResult).to.equal(writeResult);

    const removeFnResult = await viewStoreFake.lastCall.lastArg.removeFn(query);
    expect(removeFake).to.have.been.calledWith({
      store,
      query
    });
    expect(removeFnResult).to.equal(removeResult);

    expect(viewStoreFake).to.have.been.calledWith({
      streamFn: match(
        fn => expect(fn({ query, sort, parallel, fn: fnFake })).to.exist
      ),
      findFn: match(fn => expect(fn({ query, sort })).to.exist),
      findOneFn: match(fn => expect(fn({ root })).to.exist),
      writeFn: match(fn => expect(fn({ root, data })).to.exist),
      removeFn: match(fn => expect(fn({ root })).to.exist)
    });
    await mongodbViewStore();
    expect(storeFake).to.have.been.calledOnce;
  });
  it("should call with the correct params with mongo style", async () => {
    const mongodbViewStore = require("..");
    const store = "some-store";
    const storeFake = fake.returns(store);
    const findOneFake = fake.returns(foundObj);

    const cursorFake = fake.returns({
      eachAsync: async (fn, options) => {
        const view = { a: 1 };
        await fn(view);
        expect(fnFake).to.have.been.calledWith(view);
        expect(options).to.deep.equal({ parallel });
        return foundObjs;
      }
    });

    const foundObjs = {
      cursor: cursorFake
    };
    const findFake = fake.returns(foundObjs);
    const writeFake = fake.returns(writeResult);
    const removeFake = fake.returns(removeResult);

    const db = {
      store: storeFake,
      findOne: findOneFake,
      find: findFake,
      write: writeFake,
      remove: removeFake
    };
    replace(deps, "db", db);

    const secretFake = fake.returns(password);
    replace(deps, "secret", secretFake);

    const stringDate = "some-date";
    const stringDateFake = fake.returns(stringDate);
    replace(deps, "stringDate", stringDateFake);

    const viewStoreFake = fake();
    replace(deps, "viewStore", viewStoreFake);

    await mongodbViewStore({ schema, indexes });

    expect(storeFake).to.have.been.calledWith({
      name: `${domain}.${name}`,
      schema: {
        a: 1,
        b: {
          c: 2,
          _id: false
        },
        root: { type: String, required: true },
        id: { type: String, required: true, unique: true },
        created: {
          type: Date,
          required: true,
          default: match(fn => {
            const date = fn();
            return date == stringDate;
          })
        },
        modified: {
          type: Date,
          required: true,
          default: match(fn => {
            const date = fn();
            return date == stringDate;
          })
        }
      },
      indexes: [
        [{ id: 1 }],
        [{ root: 1 }],
        [{ created: 1 }],
        [{ modified: 1 }],
        "some-index"
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
          w: "majority"
        },
        autoIndex: true
      }
    });
    expect(secretFake).to.have.been.calledWith("mongodb");

    const id = "some-id";
    const findOneFnResult = await viewStoreFake.lastCall.lastArg.findOneFn({
      id
    });
    expect(findOneFake).to.have.been.calledWith({
      store,
      query: { id },
      options: { lean: true }
    });
    expect(findOneFnResult).to.equal(foundObj);

    const findFnResult = await viewStoreFake.lastCall.lastArg.findFn({
      query,
      sort
    });

    expect(findFake).to.have.been.calledWith({
      store,
      query,
      sort,
      options: {
        lean: true
      }
    });
    expect(findFnResult).to.equal(foundObjs);

    const steamFnResult = await viewStoreFake.lastCall.lastArg.streamFn({
      query,
      sort,
      parallel,
      fn: fnFake
    });

    expect(findFake).to.have.been.calledWith({
      store,
      query,
      sort,
      options: {
        lean: true
      }
    });
    expect(steamFnResult).to.equal(foundObjs);

    const mongoKey = "$some-mongo-key";
    const plainKey = "some-plain-key";
    const writeFnResult = await viewStoreFake.lastCall.lastArg.writeFn({
      id,
      data: {
        [mongoKey]: { a: 3 },
        [plainKey]: 5,
        $set: { k: 9 }
      }
    });
    expect(writeFake).to.have.been.calledWith({
      store,
      query: { id },
      update: {
        $set: {
          [plainKey]: 5,
          k: 9
        },
        [mongoKey]: { a: 3 }
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
    expect(writeFnResult).to.equal(writeResult);

    const removeFnResult = await viewStoreFake.lastCall.lastArg.removeFn(query);
    expect(removeFake).to.have.been.calledWith({
      store,
      query
    });
    expect(removeFnResult).to.equal(removeResult);

    await mongodbViewStore();
    expect(storeFake).to.have.been.calledOnce;
  });
});
