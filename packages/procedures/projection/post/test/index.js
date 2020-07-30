const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace, match } = require("sinon");

const post = require("..");
const deps = require("../deps");

const timestamp = 5;

const action = "some-action";
const domain = "some-domain";
const service = "some-service";
const root = "some-root";

const aggregateFn = "some-aggregate-fn";
const readFactFn = "some-read-fact-fn";

const data = Buffer.from(
  JSON.stringify({ timestamp, action, domain, service, root })
);

describe("Command handler post", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const mainFnFake = fake();
    const aggregateStreamFnFake = fake();

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
      aggregateStreamFn: aggregateStreamFnFake,
      aggregateFn,
      readFactFn,
    })(req, res);

    expect(aggregateStreamFnFake).to.have.been.calledWith({
      updatedOnOrAfter: timestamp,
      root,
      action,
      domain,
      service,
      fn: match((fn) => {
        const aggregate = "some-aggregate";
        fn(aggregate);
        return mainFnFake.calledWith({
          aggregate,
          aggregateFn,
          readFactFn,
          action,
          push: true,
        });
      }),
    });

    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params if push is false and no timestamp, action, domain, or service", async () => {
    const mainFnFake = fake();
    const aggregateStreamFnFake = fake();

    const data = Buffer.from(JSON.stringify({ push: false }));
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
      aggregateStreamFn: aggregateStreamFnFake,
      aggregateFn,
      readFactFn,
    })(req, res);

    expect(aggregateStreamFnFake).to.have.been.calledWith({
      fn: match((fn) => {
        const aggregate = "some-aggregate";
        fn(aggregate);
        return mainFnFake.calledWith({
          aggregate,
          aggregateFn,
          readFactFn,
          push: false,
        });
      }),
    });

    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params with no message", async () => {
    const mainFnFake = fake();
    const aggregateStreamFnFake = fake();

    const req = {
      body: {},
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    await post({
      mainFn: mainFnFake,
      aggregateStreamFn: aggregateStreamFnFake,
      aggregateFn,
      readFactFn,
    })(req, res);

    expect(aggregateStreamFnFake).to.have.been.calledWith({
      fn: match((fn) => {
        const aggregate = "some-aggregate";
        fn(aggregate);
        return mainFnFake.calledWith({
          aggregate,
          aggregateFn,
          readFactFn,
          push: false,
        });
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
