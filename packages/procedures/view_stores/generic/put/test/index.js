const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));

const { restore, replace, fake, useFakeTimers } = require("sinon");

const put = require("..");
const deps = require("../deps");

let clock;

const now = new Date();

const view = "some-view";
const id = "some-id";
const body = {
  a: 1,
  id: "bogus",
  created: "more-bogus",
  modified: "even-more-bogus"
};
const params = {
  id
};

describe("View store put", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const writeFake = fake.returns(view);

    const req = {
      params,
      body
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    await put({ writeFn: writeFake })(req, res);

    expect(writeFake).to.have.been.calledWith({
      id,
      data: {
        a: 1,
        modified: deps.dateString()
      }
    });
    expect(sendFake).to.have.been.calledOnce;
  });

  it("should call with the correct params", async () => {
    const writeFake = fake.returns(view);

    const req = {
      params,
      body
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    const fnFake = fake.returns({ data: { b: 2 } });
    await put({ writeFn: writeFake, dataFn: fnFake })(req, res);

    expect(writeFake).to.have.been.calledWith({
      id,
      data: {
        b: 2,
        modified: deps.dateString()
      }
    });
    expect(fnFake).to.have.been.calledWith(body);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should throw if id is missing", async () => {
    const writeFake = fake.returns(view);

    const req = {
      params: {},
      body
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    const error = "some-error";
    const missingIdFake = fake.returns(error);
    replace(deps, "badRequestError", {
      missingId: missingIdFake
    });

    const fnFake = fake.returns({ $set: { b: 2 } });

    try {
      await put({ writeFn: writeFake, fn: fnFake })(req, res);

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
