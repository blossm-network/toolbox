const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, fake, replace, useFakeTimers } = require("sinon");

const post = require("..");
const deps = require("../deps");

let clock;

const now = new Date();

const body = {
  a: 1,
  id: "some-bogus",
  created: "more-bogus"
};
const uuid = "some-uuid";

describe("Event store post", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });

  it("should call with the correct params", async () => {
    const writeFnFake = fake();
    const mapReduceFnFake = fake();

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
    await post({ writeFn: writeFnFake, mapReduceFn: mapReduceFnFake })(
      req,
      res
    );
    expect(writeFnFake).to.have.been.calledWith({
      id: uuid,
      data: {
        a: 1,
        id: uuid,
        created: deps.dateString()
      }
    });
    expect(mapReduceFnFake).to.have.been.calledWith({
      id: uuid
    });
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledOnce;
  });
  it("should throw correctly", async () => {
    const error = new Error();
    const writeFnFake = fake.rejects(error);
    const mapReduceFnFake = fake();

    const req = {
      body
    };

    const res = {};

    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);

    try {
      await post({ writeFn: writeFnFake, mapReduceFn: mapReduceFnFake })(
        req,
        res
      );
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
