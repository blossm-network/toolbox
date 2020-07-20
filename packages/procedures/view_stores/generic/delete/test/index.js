const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const del = require("..");
const deps = require("../deps");

const query = { a: 1 };
const contextRoot = "some-context-root";
const contextDomain = "some-context-domain";
const contextService = "some-context-service";
const contextNetwork = "some-context-network";
const context = {
  [contextDomain]: {
    root: contextRoot,
    service: contextService,
    network: contextNetwork,
  },
};
const deletedCount = 3;

process.env.CONTEXT = contextDomain;

describe("View store delete", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params with context and id only", async () => {
    const removeFake = fake.returns({ deletedCount });

    const id = "some-id";
    const req = {
      body: {
        context,
        query: {},
        id,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    await del({ removeFn: removeFake })(req, res);
    expect(removeFake).to.have.been.calledWith({
      "headers.id": id,
      "headers.context.root": contextRoot,
      "headers.context.domain": contextDomain,
      "headers.context.service": contextService,
      "headers.context.network": contextNetwork,
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({ deletedCount });
  });
  it("should call with the correct params with query", async () => {
    const removeFake = fake.returns({ deletedCount });

    const req = {
      body: {
        query,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    await del({ removeFn: removeFake })(req, res);
    expect(removeFake).to.have.been.calledWith({ "body.a": 1 });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({ deletedCount });
  });
  it("should call with the correct params with query and context", async () => {
    const removeFake = fake.returns({ deletedCount });

    const req = {
      body: {
        query,
        context,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    await del({ removeFn: removeFake })(req, res);
    expect(removeFake).to.have.been.calledWith({
      "body.a": 1,
      "headers.context.root": contextRoot,
      "headers.context.domain": contextDomain,
      "headers.context.service": contextService,
      "headers.context.network": contextNetwork,
    });
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith({ deletedCount });
  });
  it("should throw if missing root params", async () => {
    const removeFake = fake.returns({ deletedCount });

    const req = {
      body: {},
    };

    const res = {};

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps, "badRequestError", {
      message: messageFake,
    });

    try {
      await del({ removeFn: removeFake })(req, res);

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
      expect(messageFake).to.have.been.calledWith("Missing query.");
    }
  });
});
