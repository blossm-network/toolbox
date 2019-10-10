const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const stream = require("..");
const deps = require("../deps");

const query = {
  a: 1
};
const store = "some-store";

describe("View store stream", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const writeFake = fake();
    const endFake = fake();
    const res = {
      write: writeFake,
      end: endFake
    };

    const findFake = fake.returns({
      eachAsync: async (fn, options) => {
        const view = "some-view";
        await fn(view);
        expect(writeFake).to.have.been.calledWith(view);
        expect(options).to.deep.equal({ parallel: 1 });
      }
    });
    const db = {
      find: findFake
    };
    replace(deps, "db", db);

    const req = {
      query
    };

    await stream({ store })(req, res);
    expect(findFake).to.have.been.calledWith({
      store,
      query: {
        a: 1
      },
      options: {
        lean: true
      }
    });
    expect(endFake).to.have.been.calledWith();
  });
  // it("should call with the correct params if a fn is passed in", async () => {
  //   const findOneFake = fake.returns(objs);
  //   const db = {
  //     findOne: findOneFake
  //   };
  //   replace(deps, "db", db);
  //   const params = {
  //     id
  //   };
  //   const req = {
  //     query,
  //     params
  //   };

  //   const sendFake = fake();
  //   const res = {
  //     send: sendFake
  //   };

  //   const fnFake = fake.returns({ query: { b: 2 } });
  //   await get({ store, fn: fnFake })(req, res);
  //   expect(fnFake).to.have.been.calledWith(query);
  //   expect(findOneFake).to.have.been.calledWith({
  //     store,
  //     query: {
  //       id
  //     },
  //     options: {
  //       lean: true
  //     }
  //   });
  //   expect(sendFake).to.have.been.calledWith(objs);
  // });
  it("should call with the correct params", async () => {
    const writeFake = fake();
    const endFake = fake();
    const res = {
      write: writeFake,
      end: endFake
    };

    const findFake = fake.returns({
      eachAsync: async (fn, options) => {
        const view = "some-view";
        await fn(view);
        expect(writeFake).to.have.been.calledWith(view);
        expect(options).to.deep.equal({ parallel: 1 });
      }
    });
    const db = {
      find: findFake
    };
    replace(deps, "db", db);

    const req = {
      query
    };

    const fnFake = fake.returns({ query: { b: 2 } });
    await stream({ store, fn: fnFake })(req, res);

    expect(fnFake).to.have.been.calledWith(query);
    expect(findFake).to.have.been.calledWith({
      store,
      query: {
        b: 2
      },
      options: {
        lean: true
      }
    });
    expect(endFake).to.have.been.calledWith();
  });
  // it("should call with the correct params if a fn is passed in with sort", async () => {
  //   const findFake = fake.returns(objs);
  //   const db = {
  //     find: findFake
  //   };
  //   replace(deps, "db", db);
  //   const params = {};
  //   const req = {
  //     query,
  //     params
  //   };

  //   const sendFake = fake();
  //   const res = {
  //     send: sendFake
  //   };

  //   const sort = "some-sort";
  //   const fnFake = fake.returns({ query: { b: 2 }, sort });
  //   await get({ store, fn: fnFake })(req, res);
  //   expect(fnFake).to.have.been.calledWith(query);
  //   expect(findFake).to.have.been.calledWith({
  //     store,
  //     query: {
  //       b: 2
  //     },
  //     sort,
  //     options: {
  //       lean: true
  //     }
  //   });
  //   expect(sendFake).to.have.been.calledWith(objs);
  // });
  it("should call with the correct params", async () => {
    const writeFake = fake();
    const endFake = fake();
    const res = {
      write: writeFake,
      end: endFake
    };

    const findFake = fake.returns({
      eachAsync: async (fn, options) => {
        const view = "some-view";
        await fn(view);
        expect(writeFake).to.have.been.calledWith(view);
        expect(options).to.deep.equal({ parallel: 1 });
      }
    });
    const db = {
      find: findFake
    };
    replace(deps, "db", db);

    const req = {
      query
    };

    const sort = "some-sort";
    const fnFake = fake.returns({ query: { b: 2 }, sort });
    await stream({ store, fn: fnFake })(req, res);

    expect(fnFake).to.have.been.calledWith(query);
    expect(findFake).to.have.been.calledWith({
      store,
      query: {
        b: 2
      },
      sort,
      options: {
        lean: true
      }
    });
    expect(endFake).to.have.been.calledWith();
  });
  it("should call with the correct params", async () => {
    const writeFake = fake();
    const endFake = fake();
    const res = {
      write: writeFake,
      end: endFake
    };

    const errMessage = "some-error";
    const findFake = fake.throws(new Error(errMessage));
    const db = {
      find: findFake
    };
    replace(deps, "db", db);

    const req = {
      query
    };

    const sort = "some-sort";
    const fnFake = fake.returns({ query: { b: 2 }, sort });

    try {
      await stream({ store, fn: fnFake })(req, res);

      //shouldn't be called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errMessage);
    }
  });
});
