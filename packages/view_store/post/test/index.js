const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, fake, replace, useFakeTimers } = require("sinon");

const post = require("..");
const deps = require("../deps");

let clock;

const now = new Date();

const objs = "some-objs";
const body = {
  a: 1,
  id: "some-bogus",
  created: "more-bogus",
  modified: "even-more-bogus"
};
const uuid = "some-uuid";

describe("View store post", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const writeFake = fake.returns(objs);
    const store = {
      write: writeFake
    };
    const req = {
      body
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);
    await post({ store })(req, res);
    expect(writeFake).to.have.been.calledWith({
      query: { id: uuid },
      update: {
        $set: {
          a: 1,
          id: uuid,
          modified: deps.fineTimestamp(),
          created: deps.fineTimestamp()
        }
      }
    });
    expect(sendFake).to.have.been.calledOnce;
  });

  it("should call with the correct params", async () => {
    const writeFake = fake.returns(objs);
    const store = {
      write: writeFake
    };
    const req = {
      body
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);

    const fnFake = fake.returns({ $set: { b: 2 } });
    await post({ store, fn: fnFake })(req, res);

    expect(writeFake).to.have.been.calledWith({
      query: { id: uuid },
      update: {
        $set: {
          b: 2,
          id: uuid,
          modified: deps.fineTimestamp(),
          created: deps.fineTimestamp()
        }
      }
    });
    expect(fnFake).to.have.been.calledWith(body);
    expect(sendFake).to.have.been.calledOnce;
  });
});
