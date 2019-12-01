const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, match, useFakeTimers } = require("sinon");

const deps = require("../deps");

let clock;

const now = new Date();

const schema = { a: 1 };
const indexes = ["some-index"];

const protocol = "some-db-protocol";
const domain = "some-domain";
const name = "some-name";
const user = "some-db-user";
const userPassword = "some-db-user-password";
const host = "some-host";
const database = "some-db";
const password = "some-password";
const id = "some-id";
const query = "some-query";
const sort = "some-sort";

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

    await mongodbViewStore({ schema, indexes, getFn, postFn, putFn });

    expect(storeFake).to.have.been.calledWith({
      name: `${domain}.${name}`,
      schema: {
        a: 1,
        id: { type: String, required: true, unique: true },
        created: {
          type: String,
          required: true,
          default: match(fn => {
            const date = fn();
            return date == stringDate;
          })
        },
        modified: {
          type: String,
          required: true,
          default: match(fn => {
            const date = fn();
            return date == stringDate;
          })
        }
      },
      indexes: [[{ id: 1 }], [{ created: 1 }], [{ modified: 1 }], "some-index"],
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

    expect(viewStoreFake).to.have.been.calledWith({
      getFn,
      postFn,
      putFn,
      findOneFn: match(async fn => {
        const result = await fn({ id });
        return (
          expect(findOneFake).to.have.been.calledWith({
            store,
            query: {
              id
            },
            options: {
              lean: true
            }
          }) && expect(result).to.equal(foundObj)
        );
      }),
      findFn: match(async fn => {
        const result = await fn({ query, sort });
        return (
          expect(findFake).to.have.been.calledWith({
            store,
            query,
            sort,
            options: {
              lean: true
            }
          }) && expect(result).to.equal(foundObjs)
        );
      }),
      streamFn: match(async fn => {
        const result = await fn({ query, sort, parallel, fn: fnFake });
        return (
          expect(findFake).to.have.been.calledWith({
            store,
            query,
            sort,
            options: {
              lean: true
            }
          }) && expect(result).to.equal(foundObjs)
        );
      }),
      writeFn: match(async fn => {
        const result = await fn({ id, data });
        return (
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
          }) && expect(result).to.equal(writeResult)
        );
      }),
      removeFn: match(async fn => {
        const result = await fn({ id });
        return (
          expect(removeFake).to.have.been.calledWith({
            store,
            query: {
              id
            }
          }) && expect(result).to.equal(removeResult)
        );
      })
    });
    await mongodbViewStore();
    expect(storeFake).to.have.been.calledOnce;
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
        id: { type: String, required: true, unique: true },
        created: {
          type: String,
          required: true,
          default: match(fn => {
            const date = fn();
            return date == stringDate;
          })
        },
        modified: {
          type: String,
          required: true,
          default: match(fn => {
            const date = fn();
            return date == stringDate;
          })
        }
      },
      indexes: [[{ id: 1 }], [{ created: 1 }], [{ modified: 1 }], "some-index"],
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

    expect(viewStoreFake).to.have.been.calledWith({
      findOneFn: match(async fn => {
        const result = await fn({ id });
        return (
          expect(findOneFake).to.have.been.calledWith({
            store,
            query: {
              id
            },
            options: {
              lean: true
            }
          }) && expect(result).to.equal(foundObj)
        );
      }),
      findFn: match(async fn => {
        const result = await fn({ query, sort });
        return (
          expect(findFake).to.have.been.calledWith({
            store,
            query,
            sort,
            options: {
              lean: true
            }
          }) && expect(result).to.equal(foundObjs)
        );
      }),
      streamFn: match(async fn => {
        const result = await fn({ query, sort, parallel, fn: fnFake });
        return (
          expect(findFake).to.have.been.calledWith({
            store,
            query,
            sort,
            options: {
              lean: true
            }
          }) && expect(result).to.equal(foundObjs)
        );
      }),
      writeFn: match(async fn => {
        const result = await fn({ id, data });
        return (
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
          }) && expect(result).to.equal(writeResult)
        );
      }),
      removeFn: match(async fn => {
        const result = await fn({ id });
        return (
          expect(removeFake).to.have.been.calledWith({
            store,
            query: {
              id
            }
          }) && expect(result).to.equal(removeResult)
        );
      })
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
        id: { type: String, required: true, unique: true },
        created: {
          type: String,
          required: true,
          default: match(fn => {
            const date = fn();
            return date == stringDate;
          })
        },
        modified: {
          type: String,
          required: true,
          default: match(fn => {
            const date = fn();
            return date == stringDate;
          })
        }
      },
      indexes: [[{ id: 1 }], [{ created: 1 }], [{ modified: 1 }], "some-index"],
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

    expect(viewStoreFake).to.have.been.calledWith({
      findOneFn: match(async fn => {
        const result = await fn({ id });
        return (
          expect(findOneFake).to.have.been.calledWith({
            store,
            query: {
              id
            },
            options: {
              lean: true
            }
          }) && expect(result).to.equal(foundObj)
        );
      }),
      findFn: match(async fn => {
        const result = await fn({ query, sort });
        return (
          expect(findFake).to.have.been.calledWith({
            store,
            query,
            sort,
            options: {
              lean: true
            }
          }) && expect(result).to.equal(foundObjs)
        );
      }),
      streamFn: match(async fn => {
        const result = await fn({ query, sort, parallel, fn: fnFake });
        return (
          expect(findFake).to.have.been.calledWith({
            store,
            query,
            sort,
            options: {
              lean: true
            }
          }) && expect(result).to.equal(foundObjs)
        );
      }),
      writeFn: match(async fn => {
        const mongoKey = "$some-mongo-key";
        const plainKey = "some-plain-key";
        const result = await fn({
          id,
          data: {
            [mongoKey]: { a: 3 },
            [plainKey]: 5,
            $set: { k: 9 }
          }
        });
        return (
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
          }) && expect(result).to.equal(writeResult)
        );
      }),
      removeFn: match(async fn => {
        const result = await fn({ id });
        expect(removeFake).to.have.been.calledWith({
          store,
          query: {
            id
          }
        });
        return expect(result).to.equal(removeResult);
      })
    });
    await mongodbViewStore();
    expect(storeFake).to.have.been.calledOnce;
  });
});
