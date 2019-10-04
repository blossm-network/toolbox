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
const store = "some-store";

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
    const db = {
      write: writeFake
    };
    replace(deps, "db", db);

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

    await put({ store })(req, res);

    expect(writeFake).to.have.been.calledWith({
      store,
      query: { id },
      update: {
        $set: {
          a: 1,
          modified: deps.dateString()
        }
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
    expect(sendFake).to.have.been.calledOnce;
  });

  it("should call with the correct params", async () => {
    const writeFake = fake.returns(view);
    const db = {
      write: writeFake
    };
    replace(deps, "db", db);

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

    const fnFake = fake.returns({ update: { $set: { b: 2 } } });
    await put({ store, fn: fnFake })(req, res);

    expect(writeFake).to.have.been.calledWith({
      store,
      query: { id },
      update: {
        $set: {
          b: 2,
          modified: deps.dateString()
        }
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
    expect(fnFake).to.have.been.calledWith(body);
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should throw if id is missing", async () => {
    const writeFake = fake.returns(view);
    const db = {
      write: writeFake
    };

    replace(deps, "db", db);

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

    const fnFake = fake.returns({ $set: { b: 2 } });
    expect(async () => await put({ store, fn: fnFake })(req, res)).to.throw;
  });
});
