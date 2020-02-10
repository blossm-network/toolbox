const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const get = require("..");
const deps = require("../deps");

const objs = "some-objs";
const query = {
  a: 1
};
const sort = "some-sort";
const context = "some-context";
const session = "some-session";

const id = "some-id";

describe("View store get", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const findOneFake = fake.returns(objs);

    const params = {
      id
    };
    const req = {
      query: {
        sort,
        context,
        session
      },
      params
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };
    await get({ findOneFn: findOneFake })(req, res);
    expect(findOneFake).to.have.been.calledWith({
      id,
      sort,
      context,
      session
    });
    expect(sendFake).to.have.been.calledWith(objs);
  });
  it("should call with the correct params with optionals left out", async () => {
    const findOneFake = fake.returns(objs);

    const params = {
      id
    };
    const req = {
      query: {},
      params
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };
    await get({ findOneFn: findOneFake })(req, res);
    expect(findOneFake).to.have.been.calledWith({ id });
    expect(sendFake).to.have.been.calledWith(objs);
  });
  it("should call with the correct params if no id", async () => {
    const findFake = fake.returns(objs);

    const params = {};
    const req = {
      query: {
        query,
        sort,
        session,
        context
      },
      params
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };
    await get({ findFn: findFake })(req, res);
    expect(findFake).to.have.been.calledWith({
      query,
      sort,
      session,
      context
    });
    expect(sendFake).to.have.been.calledWith(objs);
  });
  it("should call with the correct params if no id with optionals omitted", async () => {
    const findFake = fake.returns(objs);

    const params = {};
    const req = {
      query: { query },
      params
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };
    await get({ findFn: findFake })(req, res);
    expect(findFake).to.have.been.calledWith({ query });
    expect(sendFake).to.have.been.calledWith(objs);
  });
  it("should call with the correct params if a fn is passed in", async () => {
    const findFake = fake.returns(objs);
    const params = {};
    const req = {
      query: {
        query
      },
      params
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    const fnFake = fake.returns({ query: { b: 2 } });
    await get({ findFn: findFake, fn: fnFake })(req, res);
    expect(fnFake).to.have.been.calledWith(query);
    expect(findFake).to.have.been.calledWith({ query: { b: 2 } });
    expect(sendFake).to.have.been.calledWith(objs);
  });
  it("should throw correctly if not found", async () => {
    const findOneFake = fake();

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

    const error = "some-error";
    const viewNotFoundFake = fake.returns(error);
    replace(deps, "resourceNotFoundError", {
      view: viewNotFoundFake
    });

    try {
      await get({ findOneFn: findOneFake })(req, res);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
