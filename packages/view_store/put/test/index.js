const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));

const { restore, fake, useFakeTimers } = require("sinon");

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
    const store = {
      write: writeFake
    };
    const req = {
      params,
      body
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    await put({ store })(req, res);
    expect(writeFake).to.have.been.calledWith({
      query: { id },
      update: {
        $set: {
          a: 1,
          modified: deps.fineTimestamp()
        }
      }
    });
    expect(sendFake).to.have.been.calledWith(view);
  });

  it("should call with the correct params", async () => {
    const writeFake = fake.returns(view);
    const store = {
      write: writeFake
    };
    const req = {
      params,
      body
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    const fnFake = fake.returns({ $set: { b: 2 } });
    await put({ store, fn: fnFake })(req, res);

    expect(writeFake).to.have.been.calledWith({
      query: { id },
      update: {
        $set: {
          b: 2,
          modified: deps.fineTimestamp()
        }
      }
    });
    expect(fnFake).to.have.been.calledWith(body);
    expect(sendFake).to.have.been.calledWith(view);
  });
  it("should throw if id is missing", async () => {
    const writeFake = fake.returns(view);
    const store = {
      write: writeFake
    };
    const req = {
      params: {},
      body
    };

    const sendFake = fake();
    const res = {
      send: sendFake
    };

    const fnFake = fake.returns({ $set: { b: 2 } });
    expect(async () => await put({ store, fn: fnFake })(req, res)).to.throw;
  });
});
