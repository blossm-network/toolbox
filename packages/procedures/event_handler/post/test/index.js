const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace, match } = require("sinon");

const post = require("..");
const deps = require("../deps");

const timestamp = 5;

const data = Buffer.from(JSON.stringify({ timestamp }));

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
    })(req, res);

    expect(aggregateStreamFnFake).to.have.been.calledWith({
      timestamp,
      fn: match((fn) => {
        const aggregate = "some-aggregate";
        fn(aggregate);
        return mainFnFake.calledWith(aggregate, { push: true });
      }),
      sortFn: match((fn) => {
        const a = { headers: { created: 0 } };
        const b = { headers: { created: 1 } };
        const result = fn(a, b);
        return result == -1;
      }),
    });

    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params if push is false and no timestamp", async () => {
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
    })(req, res);

    expect(aggregateStreamFnFake).to.have.been.calledWith({
      fn: match((fn) => {
        const aggregate = "some-aggregate";
        fn(aggregate);
        return mainFnFake.calledWith(aggregate, { push: false });
      }),
      sortFn: match((fn) => {
        const a = { headers: { created: 0 } };
        const b = { headers: { created: 1 } };
        const result = fn(a, b);
        return result == -1;
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
    })(req, res);

    expect(aggregateStreamFnFake).to.have.been.calledWith({
      fn: match((fn) => {
        const aggregate = "some-aggregate";
        fn(aggregate);
        return mainFnFake.calledWith(aggregate, { push: false });
      }),
      sortFn: match((fn) => {
        const a = { headers: { created: 0 } };
        const b = { headers: { created: 1 } };
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
