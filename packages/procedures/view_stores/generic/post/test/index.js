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
  view: {
    a: 1,
    id: "some-bogus",
    created: "more-bogus",
    modified: "even-more-bogus"
  }
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
    const writeFake = fake.returns(view);

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
    await post({ writeFn: writeFake })(req, res);
    expect(writeFake).to.have.been.calledWith({
      id: uuid,
      data: {
        a: 1,
        id: uuid,
        modified: deps.dateString(),
        created: deps.dateString()
      }
    });
    expect(sendFake).to.have.been.calledWith({ id: uuid });
  });

  it("should call with the correct params with fn", async () => {
    const writeFake = fake.returns(view);

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

    const fnFake = fake.returns({ b: 2 });
    await post({ writeFn: writeFake, dataFn: fnFake })(req, res);

    expect(writeFake).to.have.been.calledWith({
      id: uuid,
      data: {
        b: 2,
        id: uuid,
        modified: deps.dateString(),
        created: deps.dateString()
      }
    });
    expect(fnFake).to.have.been.calledWith(body);
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({ id: uuid });
  });
  it("should throw correctly", async () => {
    const error = new Error("some-error");
    const writeFake = fake.rejects(error);

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
    try {
      await post({ writeFn: writeFake })(req, res);

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
