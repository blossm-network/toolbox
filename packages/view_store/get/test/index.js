const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake } = require("sinon");

const get = require("..");

const objs = "some-objs";
const query = {
  a: 1
};
const id = "some-id";

describe("View store get", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const findFake = fake.returns(objs);
    const store = {
      find: findFake
    };
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
    expect(findFake).to.have.been.calledWith({
      a: 1,
      id
    });
    expect(sendFake).to.have.been.calledWith(objs);
  });
  it("should call with the correct params if no id", async () => {
    const findFake = fake.returns(objs);
    const store = {
      find: findFake
    };
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
      a: 1
    });
    expect(sendFake).to.have.been.calledWith(objs);
  });
  it("should call with the correct params if a fn is passed in", async () => {
    const findFake = fake.returns(objs);
    const store = {
      find: findFake
    };
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

    const fnFake = fake.returns({ b: 2 });
    await get({ store, fn: fnFake })(req, res);
    expect(fnFake).to.have.been.calledWith(query);
    expect(findFake).to.have.been.calledWith({
      b: 2,
      id
    });
    expect(sendFake).to.have.been.calledWith(objs);
  });
});
