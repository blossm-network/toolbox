const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, fake, replace, useFakeTimers } = require("sinon");

const post = require("..");
const deps = require("../deps");

let clock;

const now = new Date();

const aggregateStoreName = "some-aggregate-store-name";

const body = {
  a: 1,
  id: "some-bogus",
  created: "more-bogus"
};
const uuid = "some-uuid";
const store = "some-store";

describe("Event store post", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const writeFake = fake();
    const mapReduceFake = fake();
    const db = {
      write: writeFake,
      mapReduce: mapReduceFake
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
    await post({ store, aggregateStoreName })(req, res);
    expect(writeFake).to.have.been.calledWith({
      store,
      query: { id: uuid },
      update: {
        $set: {
          a: 1,
          id: uuid,
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
    expect(mapReduceFake).to.have.been.calledWith({
      store,
      query: { id: uuid },
      mapFn: deps.normalize,
      reduceFn: deps.reduce,
      out: { reduce: aggregateStoreName }
    });
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should throw correctly", async () => {
    const writeFake = fake.rejects(new Error());
    const mapReduceFake = fake();
    const db = {
      write: writeFake,
      mapReduce: mapReduceFake
    };
    replace(deps, "db", db);

    const req = {
      body
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);
    expect(async () => await post({ store, aggregateStoreName })(req, res)).to
      .throw;
  });
});
