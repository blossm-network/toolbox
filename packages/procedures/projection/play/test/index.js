const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");

const play = require("..");
const deps = require("../deps");

const timestamp = 5;

const action = "some-action";
const domain = "some-domain";
const service = "some-service";
const root = "some-root";

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

    const aggregate = "some-aggregate";
    const aggregateFnFake = fake.returns(aggregate);

    const req = {
      body: {
        message: { data },
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    await play({
      mainFn: mainFnFake,
      aggregateFn: aggregateFnFake,
      readFactFn,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({
      root,
      domain,
      service,
    });

    expect(mainFnFake).to.have.been.calledWith({
      aggregate,
      aggregateFn: aggregateFnFake,
      readFactFn,
      push: true,
      action,
    });

    expect(sendStatusFake).to.have.been.calledWith(204);
  });
  it("should call with the correct params with no message", async () => {
    const mainFnFake = fake();

    const aggregate = "some-aggregate";
    const aggregateFnFake = fake.returns(aggregate);

    const bodyRoot = "some-body-root";
    const bodyDomain = "some-body-domain";
    const bodyService = "some-body-service";

    const req = {
      body: {
        root: bodyRoot,
        domain: bodyDomain,
        service: bodyService,
        action: "bogus",
        push: "bogus",
      },
    };

    const sendStatusFake = fake();
    const res = {
      sendStatus: sendStatusFake,
    };

    await play({
      mainFn: mainFnFake,
      aggregateFn: aggregateFnFake,
      readFactFn,
    })(req, res);

    expect(aggregateFnFake).to.have.been.calledWith({
      root: bodyRoot,
      domain: bodyDomain,
      service: bodyService,
    });

    expect(mainFnFake).to.have.been.calledWith({
      aggregate,
      aggregateFn: aggregateFnFake,
      readFactFn,
      push: false,
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
      await play({ mainFn: mainFnFake })(req, res);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("Invalid data format.");
      expect(e).to.equal(error);
    }
  });
});
