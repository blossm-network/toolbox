const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");
const get = require("..");

const name = "some-name";

const context = "some-context";
process.env.CONTEXT = context;

describe("View gateway get", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const queryContextRoot = "some-query-context-root";
    const queryContextService = "some-query-context-service";
    const queryContextNetwork = "some-query-context-network";
    const queryContext = {
      [context]: {
        root: queryContextRoot,
        service: queryContextService,
        network: queryContextNetwork,
      },
    };
    const query = {
      name,
      context: queryContext,
    };

    const req = {
      query,
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const channelName = "some-channel-name";
    const channelNameFake = fake.returns(channelName);
    replace(deps, "channelName", channelNameFake);
    await get(req, res);

    expect(sendFake).to.have.been.calledWith(channelName);
    expect(channelNameFake).to.have.been.calledWith({
      name,
      context: {
        root: queryContextRoot,
        domain: context,
        service: queryContextService,
        network: queryContextNetwork,
      },
    });
  });
  it("should call with the correct params with source", async () => {
    const queryContextRoot = "some-query-context-root";
    const queryContextService = "some-query-context-service";
    const queryContextNetwork = "some-query-context-network";
    const querySourceRoot = "some-query-source-root";
    const querySourceDomain = "some-query-source-domain";
    const querySourceService = "some-query-source-service";
    const querySourceNetwork = "some-query-source-network";

    const queryContext = {
      [context]: {
        root: queryContextRoot,
        service: queryContextService,
        network: queryContextNetwork,
      },
    };

    const query = {
      name,
      context: queryContext,
      source: {
        root: querySourceRoot,
        domain: querySourceDomain,
        service: querySourceService,
        network: querySourceNetwork,
      },
    };

    const req = {
      query,
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const res = {
      status: statusFake,
    };

    const channelName = "some-channel-name";
    const channelNameFake = fake.returns(channelName);
    replace(deps, "channelName", channelNameFake);

    await get(req, res);

    expect(sendFake).to.have.been.calledWith(channelName);
    expect(channelNameFake).to.have.been.calledWith({
      name,
      source: {
        root: querySourceRoot,
        domain: querySourceDomain,
        service: querySourceService,
        network: querySourceNetwork,
      },
      context: {
        root: queryContextRoot,
        domain: context,
        service: queryContextService,
        network: queryContextNetwork,
      },
    });
  });
  it("should throw if no context property", async () => {
    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });

    try {
      await get({ query: { context: {} } });
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "Missing required permissions."
      );
      expect(e).to.equal(error);
    }
  });
  it("should throw if no context", async () => {
    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });

    try {
      await get({ query: {} });
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "Missing required permissions."
      );
      expect(e).to.equal(error);
    }
  });
});
