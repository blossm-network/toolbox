const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace, match } = require("sinon");

const post = require("..");
const deps = require("../deps");

const from = 5;

const data = Buffer.from(JSON.stringify({ from }));

describe("Command handler post", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const mainFnFake = fake();
    const streamFnFake = fake();

    const req = {
      body: {
        message: { data },
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    await post({
      mainFn: mainFnFake,
      streamFn: streamFnFake,
    })(req, res);

    expect(streamFnFake).to.have.been.calledWith({
      from,
      fn: match((fn) => {
        const root = "some-root";
        const payload = "some-payload";
        const event = { data: { root, payload } };
        fn(event);
        return mainFnFake.calledWith({ payload, root });
      }),
      sortFn: match((fn) => {
        const a = { data: { saved: 0 } };
        const b = { data: { saved: 1 } };
        const result = fn(a, b);
        return result == -1;
      }),
    });

    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should throw if bad data format", async () => {
    const mainFnFake = fake();

    const data = Buffer.from("bad");
    const req = {
      body: {
        message: { data },
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });
    try {
      await post({ mainFn: mainFnFake })(req, res);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("Invalid data format.");
      expect(e).to.equal(error);
    }
  });
});
