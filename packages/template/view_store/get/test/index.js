const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const get = require("..");
const deps = require("../deps");

const objs = "some-objs";
const query = {
  a: 1
};
const id = "some-id";
const store = "some-store";

describe("View store get", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const findOneFake = fake.returns(objs);
    const db = {
      findOne: findOneFake
    };
    replace(deps, "db", db);

    const params = {
      id
    };
    const req = {
      query,
      params
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };
    await get({ store })(req, res);
    expect(findOneFake).to.have.been.calledWith({
      store,
      query: {
        id
      },
      options: {
        lean: true
      }
    });
    expect(sendFake).to.have.been.calledWith(objs);
  });
  it("should call with the correct params if no id", async () => {
    const findFake = fake.returns(objs);
    const db = {
      find: findFake
    };
    replace(deps, "db", db);

    const params = {};
    const req = {
      query,
      params
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };
    await get({ store })(req, res);
    expect(findFake).to.have.been.calledWith({
      store,
      query: {
        a: 1
      },
      options: {
        lean: true
      }
    });
    expect(sendFake).to.have.been.calledWith(objs);
  });
  it("should call with the correct params if no id with sort and context in query", async () => {
    const findFake = fake.returns(objs);
    const db = {
      find: findFake
    };
    replace(deps, "db", db);

    const params = {};
    const sort = { someKey: 3 };
    const context = { someContext: 4 };
    const req = {
      query: {
        ...query,
        sort,
        context
      },
      params
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };
    await get({ store })(req, res);
    expect(findFake).to.have.been.calledWith({
      store,
      query: {
        a: 1
      },
      sort,
      options: {
        lean: true
      }
    });
    expect(sendFake).to.have.been.calledWith(objs);
  });
  it("should call with the correct params if a fn is passed in", async () => {
    const findOneFake = fake.returns(objs);
    const db = {
      findOne: findOneFake
    };
    replace(deps, "db", db);
    const params = {
      id
    };
    const req = {
      query,
      params
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    const fnFake = fake.returns({ query: { b: 2 } });
    await get({ store, fn: fnFake })(req, res);
    expect(fnFake).to.have.been.calledWith(query);
    expect(findOneFake).to.have.been.calledWith({
      store,
      query: {
        id
      },
      options: {
        lean: true
      }
    });
    expect(sendFake).to.have.been.calledWith(objs);
  });
  it("should call with the correct params if a fn is passed in with sort", async () => {
    const findFake = fake.returns(objs);
    const db = {
      find: findFake
    };
    replace(deps, "db", db);
    const params = {};
    const req = {
      query,
      params
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    const sort = "some-sort";
    const fnFake = fake.returns({ query: { b: 2 }, sort });
    await get({ store, fn: fnFake })(req, res);
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
    expect(sendFake).to.have.been.calledWith(objs);
  });
  it("should throw correctly if not found", async () => {
    const findOneFake = fake();
    const db = {
      findOne: findOneFake
    };
    replace(deps, "db", db);

    const params = {
      id
    };
    const req = {
      query,
      params
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    expect(async () => await get({ store })(req, res)).to.throw;
  });
});
