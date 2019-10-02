const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, fake, replace, useFakeTimers } = require("sinon");

const post = require("..");
const deps = require("../deps");

let clock;

const now = new Date();

const view = "some-view";
const body = {
  a: 1,
  id: "some-bogus",
  created: "more-bogus",
  modified: "even-more-bogus"
};
const uuid = "some-uuid";
const store = "some-store";

describe("View store post", () => {
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
      body
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);
    await post({ store })(req, res);
    expect(writeFake).to.have.been.calledWith({
      store,
      query: { id: uuid },
      update: {
        $set: {
          a: 1,
          id: uuid,
          modified: deps.dateString(),
          created: deps.dateString()
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

  it("should call with the correct params with fn", async () => {
    const writeFake = fake.returns(view);
    const db = {
      write: writeFake
    };
    replace(deps, "db", db);

    const req = {
      body
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake
    });
    const res = {
      status: statusFake
    };

    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);

    const fnFake = fake.returns({ update: { $set: { b: 2 } } });
    await post({ store, fn: fnFake })(req, res);

    expect(writeFake).to.have.been.calledWith({
      store,
      query: { id: uuid },
      update: {
        $set: {
          b: 2,
          id: uuid,
          modified: deps.dateString(),
          created: deps.dateString()
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
  it("should throw correctly", async () => {
    const writeFake = fake.rejects(new Error());
    const db = {
      write: writeFake
    };
    replace(deps, "db", db);

    const req = {
      body
    };

    const statusFake = fake();
    const sendFake = fake.returns({
      status: statusFake
    });

    const res = {
      send: sendFake
    };

    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);
    expect(async () => await post({ store })(req, res)).to.throw;
  });
});
